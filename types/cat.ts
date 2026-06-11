export type CatStatus = 'active' | 'pending' | 'hidden' | 'rejected' | 'reported';

export type CatProfile = {
  id: string;
  name?: string;
  description?: string;
  mainPhotoUri?: string;
  mainPhotoUrl?: string;
  homeLocationLabel?: string;
  homeLatitude?: number;
  homeLongitude?: number;
  lastSeenLatitude?: number;
  lastSeenLongitude?: number;
  lastSeenAt?: string;
  status: CatStatus;
  ownerStatus?: 'owner_created' | 'unknown_owner' | 'claimed';
  photoIds?: string[];
};

export type CatSighting = {
  id: string;
  catId: string;
  photoUri?: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  locationLabel?: string;
  notes?: string;
  spottedAt: string;
  status: CatStatus;
  belongsVotes: number;
  doesNotBelongVotes: number;
  userFeedback?: 'belongs' | 'does_not_belong';
};

export type Screen = 'map' | 'add' | 'profile' | 'settings';
