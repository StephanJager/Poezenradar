import { supabase } from '../lib/supabase';
import type { CatProfile, CatSighting } from '../types/cat';

type CatRow = {
  id: string;
  name: string | null;
  description: string | null;
  main_photo_url: string | null;
  home_location_label: string | null;
  home_latitude: number | null;
  home_longitude: number | null;
  last_seen_latitude: number | null;
  last_seen_longitude: number | null;
  last_seen_at: string | null;
  status: string;
  created_at: string;
};

type CatSightingRow = {
  id: string;
  cat_id: string | null;
  photo_url: string | null;
  local_photo_uri: string | null;
  latitude: number;
  longitude: number;
  location_label: string | null;
  notes: string | null;
  status: string;
  spotted_at: string;
  created_at: string;
};

type SightingInsert = {
  id: string;
  cat_id: string;
  photo_url?: string | null;
  local_photo_uri?: string | null;
  latitude: number;
  longitude: number;
  location_label?: string | null;
  notes?: string | null;
  status: 'active';
  spotted_at: string;
};

type CatInsert = {
  id: string;
  name?: string | null;
  description?: string | null;
  main_photo_url?: string | null;
  home_location_label?: string | null;
  home_latitude: number;
  home_longitude: number;
  last_seen_latitude: number;
  last_seen_longitude: number;
  last_seen_at: string;
  status: 'active';
};

const CAT_COLUMNS = [
  'id',
  'name',
  'description',
  'main_photo_url',
  'home_location_label',
  'home_latitude',
  'home_longitude',
  'last_seen_latitude',
  'last_seen_longitude',
  'last_seen_at',
  'status',
  'created_at',
].join(', ');

const CAT_SIGHTING_COLUMNS = [
  'id',
  'cat_id',
  'photo_url',
  'local_photo_uri',
  'latitude',
  'longitude',
  'location_label',
  'notes',
  'status',
  'spotted_at',
  'created_at',
].join(', ');

const CAT_PHOTOS_BUCKET = 'cat-photos';

// TODO: sync photo feedback to a future cat_photo_feedback table.
// TODO: add Supabase Storage moderation/reporting around user uploaded photos.
// TODO: add owner claiming flow.
// TODO: add moderation approval before public visibility.
// TODO: add duplicate/incorrect-photo handling and cat merge flow.
// TODO: add automatic image recognition to suggest likely duplicate profiles.
export async function fetchActiveCatProfiles() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('cats')
    .select(CAT_COLUMNS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .returns<CatRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapCatRowToProfile);
}

export async function fetchActiveCatSightings() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('cat_sightings')
    .select(CAT_SIGHTING_COLUMNS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .returns<CatSightingRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapCatSightingRow);
}

export async function uploadCatPhotoAsync(localPhotoUri: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const filePath = `sightings/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const response = await fetch(localPhotoUri);
  const fileBody = await response.arrayBuffer();

  const { error } = await supabase.storage.from(CAT_PHOTOS_BUCKET).upload(filePath, fileBody, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(CAT_PHOTOS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function insertCatProfile(payload: CatInsert) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('cats')
    .insert(payload)
    .select(CAT_COLUMNS)
    .single<CatRow>();

  if (error) {
    throw error;
  }

  return mapCatRowToProfile(data);
}

export async function insertCatSighting(payload: SightingInsert) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('cat_sightings')
    .insert(payload)
    .select(CAT_SIGHTING_COLUMNS)
    .single<CatSightingRow>();

  if (error) {
    throw error;
  }

  return mapCatSightingRow(data);
}

export async function updateCatAfterSighting({
  catId,
  latitude,
  longitude,
  lastSeenAt,
  mainPhotoUrl,
}: {
  catId: string;
  latitude: number;
  longitude: number;
  lastSeenAt: string;
  mainPhotoUrl?: string;
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const updatePayload: Record<string, string | number | null> = {
    last_seen_latitude: latitude,
    last_seen_longitude: longitude,
    last_seen_at: lastSeenAt,
  };

  if (mainPhotoUrl) {
    updatePayload.main_photo_url = mainPhotoUrl;
  }

  const { error } = await supabase.from('cats').update(updatePayload).eq('id', catId);

  if (error) {
    throw error;
  }
}

function mapCatRowToProfile(row: CatRow): CatProfile {
  return {
    id: row.id,
    name: row.name?.trim() || undefined,
    description: row.description?.trim() || undefined,
    mainPhotoUrl: row.main_photo_url ?? undefined,
    homeLocationLabel: row.home_location_label?.trim() || undefined,
    homeLatitude: row.home_latitude ?? undefined,
    homeLongitude: row.home_longitude ?? undefined,
    lastSeenLatitude: row.last_seen_latitude ?? undefined,
    lastSeenLongitude: row.last_seen_longitude ?? undefined,
    lastSeenAt: row.last_seen_at ?? undefined,
    status: 'active',
    ownerStatus: 'unknown_owner',
  };
}

function mapCatSightingRow(row: CatSightingRow): CatSighting {
  return {
    id: row.id,
    catId: row.cat_id ?? '',
    photoUrl: row.photo_url ?? undefined,
    photoUri: row.local_photo_uri ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    locationLabel: row.location_label ?? undefined,
    notes: row.notes ?? undefined,
    spottedAt: row.spotted_at,
    status: 'active',
    belongsVotes: 0,
    doesNotBelongVotes: 0,
  };
}
