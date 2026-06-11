import type { CatProfile, CatSighting } from '../types/cat';

export const initialCatProfiles: CatProfile[] = [
  {
    id: 'mila',
    name: 'Mila',
    description: 'Rustige lapjespoes die vaak bij het water ligt.',
    homeLocationLabel: 'Vondelpark, Amsterdam',
    homeLatitude: 52.358,
    homeLongitude: 4.8686,
    lastSeenLatitude: 52.358,
    lastSeenLongitude: 4.8686,
    lastSeenAt: '10 min geleden',
    status: 'active',
    ownerStatus: 'unknown_owner',
  },
  {
    id: 'sokje',
    name: 'Sokje',
    description: 'Witte pootjes, erg nieuwsgierig.',
    homeLocationLabel: 'Kinkerstraat',
    homeLatitude: 52.3643,
    homeLongitude: 4.8666,
    lastSeenLatitude: 52.3643,
    lastSeenLongitude: 4.8666,
    lastSeenAt: '24 min geleden',
    status: 'active',
    ownerStatus: 'unknown_owner',
  },
  {
    id: 'noortje',
    name: 'Noortje',
    description: 'Ligt vaak in een zonnige vensterbank.',
    homeLocationLabel: 'Da Costabuurt',
    homeLatitude: 52.3661,
    homeLongitude: 4.8753,
    lastSeenLatitude: 52.3661,
    lastSeenLongitude: 4.8753,
    lastSeenAt: '1 uur geleden',
    status: 'active',
    ownerStatus: 'unknown_owner',
  },
  {
    id: 'tijger',
    name: 'Tijger',
    description: 'Oranje streepjeskat met veel praatjes.',
    homeLocationLabel: 'Overtoom',
    homeLatitude: 52.3613,
    homeLongitude: 4.8721,
    lastSeenLatitude: 52.3613,
    lastSeenLongitude: 4.8721,
    lastSeenAt: '2 uur geleden',
    status: 'active',
    ownerStatus: 'unknown_owner',
  },
];

export const AMSTERDAM_CENTER = {
  latitude: 52.3676,
  longitude: 4.9041,
};

export function getGeneratedCoordinate(index: number) {
  return {
    latitude: AMSTERDAM_CENTER.latitude + ((index % 5) - 2) * 0.004,
    longitude: AMSTERDAM_CENTER.longitude + (((index * 2) % 5) - 2) * 0.005,
  };
}

export function getCatProfileCoordinate(cat: CatProfile) {
  const latitude = cat.lastSeenLatitude ?? cat.homeLatitude;
  const longitude = cat.lastSeenLongitude ?? cat.homeLongitude;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return { latitude, longitude };
}

export function getCatDisplayName(cat: CatProfile) {
  return cat.name?.trim() || 'Onbekende poes';
}

export function getCatPrimaryPhotoUri(cat: CatProfile) {
  return cat.mainPhotoUri ?? cat.mainPhotoUrl;
}

export function getSortedCatPhotos(cat: CatProfile, sightings: CatSighting[]) {
  const sightingPhotos = sightings
    .filter((sighting) => {
      return sighting.catId === cat.id && (sighting.photoUri || sighting.photoUrl);
    })
    .map((sighting) => ({
      id: sighting.id,
      uri: sighting.photoUri ?? sighting.photoUrl,
      spottedAt: sighting.spottedAt,
      belongsVotes: sighting.belongsVotes,
      doesNotBelongVotes: sighting.doesNotBelongVotes,
      userFeedback: sighting.userFeedback,
      isFeedbackEnabled: true,
    }));

  const hasMainPhotoInSightings = sightingPhotos.some((photo) => {
    return photo.uri === getCatPrimaryPhotoUri(cat);
  });

  if (getCatPrimaryPhotoUri(cat) && !hasMainPhotoInSightings) {
    sightingPhotos.push({
      id: `profile-photo-${cat.id}`,
      uri: getCatPrimaryPhotoUri(cat),
      spottedAt: cat.lastSeenAt ?? '',
      belongsVotes: 0,
      doesNotBelongVotes: 0,
      userFeedback: undefined,
      isFeedbackEnabled: false,
    });
  }

  return sightingPhotos
    .filter((photo): photo is typeof photo & { uri: string } => Boolean(photo.uri))
    .sort((a, b) => {
      const aScore = a.belongsVotes - a.doesNotBelongVotes;
      const bScore = b.belongsVotes - b.doesNotBelongVotes;

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      return new Date(b.spottedAt).getTime() - new Date(a.spottedAt).getTime();
    });
}
