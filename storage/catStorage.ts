import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CatProfile, CatSighting } from '../types/cat';

const CAT_PROFILES_STORAGE_KEY = 'poezenradar.catProfiles.v1';
const CAT_SIGHTINGS_STORAGE_KEY = 'poezenradar.catSightings.v2';

function isStatus(value: unknown) {
  return (
    value === 'active' ||
    value === 'pending' ||
    value === 'hidden' ||
    value === 'rejected' ||
    value === 'reported'
  );
}

function isCatProfile(value: unknown): value is CatProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const cat = value as Partial<CatProfile>;

  return (
    typeof cat.id === 'string' &&
    isStatus(cat.status) &&
    (typeof cat.name === 'undefined' || typeof cat.name === 'string') &&
    (typeof cat.description === 'undefined' || typeof cat.description === 'string') &&
    (typeof cat.mainPhotoUri === 'undefined' || typeof cat.mainPhotoUri === 'string') &&
    (typeof cat.mainPhotoUrl === 'undefined' || typeof cat.mainPhotoUrl === 'string') &&
    (typeof cat.homeLocationLabel === 'undefined' || typeof cat.homeLocationLabel === 'string') &&
    (typeof cat.homeLatitude === 'undefined' || typeof cat.homeLatitude === 'number') &&
    (typeof cat.homeLongitude === 'undefined' || typeof cat.homeLongitude === 'number') &&
    (typeof cat.lastSeenLatitude === 'undefined' || typeof cat.lastSeenLatitude === 'number') &&
    (typeof cat.lastSeenLongitude === 'undefined' || typeof cat.lastSeenLongitude === 'number') &&
    (typeof cat.lastSeenAt === 'undefined' || typeof cat.lastSeenAt === 'string') &&
    (typeof cat.photoIds === 'undefined' ||
      (Array.isArray(cat.photoIds) && cat.photoIds.every((photoId) => typeof photoId === 'string'))) &&
    (typeof cat.ownerStatus === 'undefined' ||
      cat.ownerStatus === 'owner_created' ||
      cat.ownerStatus === 'unknown_owner' ||
      cat.ownerStatus === 'claimed')
  );
}

function normalizeCatSighting(value: unknown): CatSighting | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const sighting = value as Partial<CatSighting>;

  if (
    typeof sighting.id === 'string' &&
    typeof sighting.catId === 'string' &&
    (typeof sighting.photoUri === 'undefined' || typeof sighting.photoUri === 'string') &&
    (typeof sighting.photoUrl === 'undefined' || typeof sighting.photoUrl === 'string') &&
    typeof sighting.latitude === 'number' &&
    typeof sighting.longitude === 'number' &&
    (typeof sighting.locationLabel === 'undefined' || typeof sighting.locationLabel === 'string') &&
    (typeof sighting.notes === 'undefined' || typeof sighting.notes === 'string') &&
    typeof sighting.spottedAt === 'string' &&
    isStatus(sighting.status) &&
    (typeof sighting.belongsVotes === 'undefined' || typeof sighting.belongsVotes === 'number') &&
    (typeof sighting.doesNotBelongVotes === 'undefined' ||
      typeof sighting.doesNotBelongVotes === 'number') &&
    (typeof sighting.userFeedback === 'undefined' ||
      sighting.userFeedback === 'belongs' ||
      sighting.userFeedback === 'does_not_belong')
  ) {
    return {
      id: sighting.id,
      catId: sighting.catId,
      photoUri: sighting.photoUri,
      photoUrl: sighting.photoUrl,
      latitude: sighting.latitude,
      longitude: sighting.longitude,
      locationLabel: sighting.locationLabel,
      notes: sighting.notes,
      spottedAt: sighting.spottedAt,
      status: sighting.status,
      belongsVotes: sighting.belongsVotes ?? 0,
      doesNotBelongVotes: sighting.doesNotBelongVotes ?? 0,
      userFeedback: sighting.userFeedback,
    };
  }

  return null;
}

export async function loadLocalCatProfiles() {
  const savedProfiles = await AsyncStorage.getItem(CAT_PROFILES_STORAGE_KEY);
  if (!savedProfiles) {
    return [];
  }

  const parsedProfiles: unknown = JSON.parse(savedProfiles);
  if (!Array.isArray(parsedProfiles) || !parsedProfiles.every(isCatProfile)) {
    return [];
  }

  return parsedProfiles;
}

export async function saveLocalCatProfiles(profiles: CatProfile[]) {
  await AsyncStorage.setItem(CAT_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

export async function loadLocalCatSightings() {
  const savedSightings = await AsyncStorage.getItem(CAT_SIGHTINGS_STORAGE_KEY);
  if (!savedSightings) {
    return [];
  }

  const parsedSightings: unknown = JSON.parse(savedSightings);
  if (!Array.isArray(parsedSightings)) {
    return [];
  }

  return parsedSightings
    .map(normalizeCatSighting)
    .filter((sighting): sighting is CatSighting => sighting !== null);
}

export async function saveLocalCatSightings(sightings: CatSighting[]) {
  await AsyncStorage.setItem(CAT_SIGHTINGS_STORAGE_KEY, JSON.stringify(sightings));
}

export async function clearLocalCats() {
  await AsyncStorage.multiRemove([CAT_PROFILES_STORAGE_KEY, CAT_SIGHTINGS_STORAGE_KEY]);
}
