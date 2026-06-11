import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet } from 'react-native';

import BottomNav from '../../components/bottom-nav';
import { initialCatProfiles } from '../../data/cats';
import AddCatScreen from '../../screens/add-cat-screen';
import MapScreen from '../../screens/map-screen';
import PlaceholderScreen from '../../screens/placeholder-screen';
import SettingsScreen from '../../screens/settings-screen';
import {
  fetchActiveCatProfiles,
  fetchActiveCatSightings,
  insertCatProfile,
  insertCatSighting,
  updateCatAfterSighting,
  uploadCatPhotoAsync,
} from '../../services/catSightingsApi';
import {
  clearLocalCats,
  loadLocalCatProfiles,
  loadLocalCatSightings,
  saveLocalCatProfiles,
  saveLocalCatSightings,
} from '../../storage/catStorage';
import type { CatProfile, CatSighting, Screen } from '../../types/cat';
import { createUuid, isUuid } from '../../utils/id';

type SightingDraft = {
  photoUri?: string;
  latitude: number;
  longitude: number;
  locationLabel?: string;
  notes?: string;
};

type NewCatDraft = SightingDraft & {
  name?: string;
  description?: string;
  notes?: string;
};

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('map');
  const [catProfiles, setCatProfiles] = useState<CatProfile[]>(initialCatProfiles);
  const [catSightings, setCatSightings] = useState<CatSighting[]>([]);
  const [selectedCatId, setSelectedCatId] = useState(initialCatProfiles[0].id);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [photoMessage, setPhotoMessage] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [isLoadingSightings, setIsLoadingSightings] = useState(true);

  const selectedCat = useMemo(
    () => (selectedCatId ? catProfiles.find((cat) => cat.id === selectedCatId) : undefined),
    [catProfiles, selectedCatId],
  );

  const applyProfiles = useCallback((nextProfiles: CatProfile[]) => {
    setCatProfiles(nextProfiles);
    setSelectedCatId(nextProfiles[0]?.id ?? '');
  }, []);

  const loadLocalFallback = useCallback(async () => {
    try {
      const [localProfiles, localSightings] = await Promise.all([
        loadLocalCatProfiles(),
        loadLocalCatSightings(),
      ]);

      setCatSightings(localSightings);
      applyProfiles(localProfiles.length > 0 ? localProfiles : initialCatProfiles);
    } catch {
      applyProfiles(initialCatProfiles);
      setCatSightings([]);
      setStorageMessage('Lokale poezen konden niet worden geladen. We tonen de voorbeeldpoezen.');
    }
  }, [applyProfiles]);

  const loadRemoteProfiles = useCallback(
    async ({
      applyProfiles: applyRemoteProfiles,
      applyFallback,
      finish,
      shouldApply = () => true,
    }: {
      applyProfiles: (nextProfiles: CatProfile[]) => void;
      applyFallback: () => Promise<void>;
      finish: () => void;
      shouldApply?: () => boolean;
    }) => {
      try {
        setIsLoadingSightings(true);
        const [remoteProfiles, remoteSightings, localProfiles, localSightings] = await Promise.all([
          fetchActiveCatProfiles(),
          fetchActiveCatSightings(),
          loadLocalCatProfiles(),
          loadLocalCatSightings(),
        ]);
        if (!shouldApply()) {
          return;
        }
        setCatSightings(mergeSightings(remoteSightings, localSightings));
        applyRemoteProfiles(mergeProfiles(remoteProfiles, localProfiles));
        setSyncMessage('Nieuwste actieve poezen geladen.');
      } catch {
        if (!shouldApply()) {
          return;
        }
        await applyFallback();
        setSyncMessage('Online meldingen zijn niet beschikbaar. We tonen lokale poezen.');
      } finally {
        if (shouldApply()) {
          finish();
        }
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProfiles() {
      await loadRemoteProfiles({
        applyProfiles: (nextProfiles) => {
          if (isMounted) {
            applyProfiles(nextProfiles);
          }
        },
        applyFallback: async () => {
          if (isMounted) {
            await loadLocalFallback();
          }
        },
        finish: () => {
          if (isMounted) {
            setIsLoadingSightings(false);
          }
        },
        shouldApply: () => isMounted,
      });
    }

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [applyProfiles, loadLocalFallback, loadRemoteProfiles]);

  async function handleRefreshSightings() {
    await loadRemoteProfiles({
      applyProfiles,
      applyFallback: loadLocalFallback,
      finish: () => setIsLoadingSightings(false),
    });
  }

  function handleDismissSelectedCat() {
    setSelectedCatId('');
  }

  function handlePreviewCat(catId: string) {
    setSelectedCatId(catId);
    setScreen('map');
  }

  async function handleLinkExistingCat(catId: string, draft: SightingDraft) {
    const spottedAt = new Date().toISOString();
    const newSighting = createLocalSighting(catId, draft, spottedAt);
    const nextProfiles = catProfiles.map((cat) =>
      cat.id === catId ? updateProfileFromSighting(cat, draft, spottedAt, newSighting.id) : cat,
    );
    const linkedCat = nextProfiles.find((cat) => cat.id === catId);

    applyProfilesWithSelection(nextProfiles, catId);
    await saveLocalState(nextProfiles, [...catSightings, newSighting]);
    resetAddForm();
    setScreen('map');

    try {
      if (!isUuid(catId)) {
        throw new Error('Only Supabase UUID cats can be synced online.');
      }

      const uploadedPhotoUrl = draft.photoUri ? await uploadCatPhotoAsync(draft.photoUri) : undefined;
      await insertCatSighting({
        id: newSighting.id,
        cat_id: catId,
        photo_url: uploadedPhotoUrl ?? null,
        local_photo_uri: null,
        latitude: draft.latitude,
        longitude: draft.longitude,
        location_label: draft.locationLabel ?? null,
        notes: draft.notes ?? null,
        status: 'active',
        spotted_at: spottedAt,
      });
      await updateCatAfterSighting({
        catId,
        latitude: draft.latitude,
        longitude: draft.longitude,
        lastSeenAt: spottedAt,
        mainPhotoUrl: linkedCat?.mainPhotoUrl || linkedCat?.mainPhotoUri ? undefined : uploadedPhotoUrl,
      });
      setSyncMessage('Waarneming online opgeslagen.');
      await handleRefreshSightings();
    } catch {
      setSyncMessage('Online opslaan lukte niet. Poes lokaal opgeslagen.');
    }
  }

  async function handleRegisterNewCat(draft: NewCatDraft) {
    const spottedAt = new Date().toISOString();
    const newCat: CatProfile = {
      id: createUuid(),
      name: draft.name,
      description: draft.description,
      mainPhotoUri: draft.photoUri,
      homeLocationLabel: draft.locationLabel ?? 'Locatie automatisch bepaald',
      homeLatitude: draft.latitude,
      homeLongitude: draft.longitude,
      lastSeenLatitude: draft.latitude,
      lastSeenLongitude: draft.longitude,
      lastSeenAt: spottedAt,
      status: 'active',
      ownerStatus: 'unknown_owner',
      photoIds: [],
    };
    const newSighting = createLocalSighting(newCat.id, draft, spottedAt);
    const nextProfiles = [...catProfiles, { ...newCat, photoIds: [newSighting.id] }];

    applyProfilesWithSelection(nextProfiles, newCat.id);
    await saveLocalState(nextProfiles, [...catSightings, newSighting]);
    resetAddForm();
    setScreen('map');

    try {
      const uploadedPhotoUrl = draft.photoUri ? await uploadCatPhotoAsync(draft.photoUri) : undefined;
      await insertCatProfile({
        id: newCat.id,
        name: draft.name ?? null,
        description: draft.description ?? null,
        main_photo_url: uploadedPhotoUrl ?? null,
        home_location_label: draft.locationLabel ?? null,
        home_latitude: draft.latitude,
        home_longitude: draft.longitude,
        last_seen_latitude: draft.latitude,
        last_seen_longitude: draft.longitude,
        last_seen_at: spottedAt,
        status: 'active',
      });
      await insertCatSighting({
        id: newSighting.id,
        cat_id: newCat.id,
        photo_url: uploadedPhotoUrl ?? null,
        local_photo_uri: null,
        latitude: draft.latitude,
        longitude: draft.longitude,
        location_label: draft.locationLabel ?? null,
        notes: draft.notes ?? null,
        status: 'active',
        spotted_at: spottedAt,
      });
      setSyncMessage('Nieuwe poes online geregistreerd.');
      await handleRefreshSightings();
    } catch {
      setSyncMessage('Online opslaan lukte niet. Poes lokaal opgeslagen.');
    }
  }

  async function handleResetSightings() {
    applyProfiles(initialCatProfiles);
    setCatSightings([]);

    try {
      await clearLocalCats();
      setStorageMessage('Lokale poezen zijn gewist.');
    } catch {
      setStorageMessage('Lokale poezen wissen lukte niet. Probeer het later opnieuw.');
    }
  }

  async function handlePhotoFeedback(
    sightingId: string,
    feedback: 'belongs' | 'does_not_belong',
  ) {
    const nextSightings = catSightings.map((sighting) => {
      if (sighting.id !== sightingId) {
        return sighting;
      }

      const previousFeedback = sighting.userFeedback;
      const removeBelongsVote = previousFeedback === 'belongs' ? 1 : 0;
      const removeDoesNotBelongVote = previousFeedback === 'does_not_belong' ? 1 : 0;
      const addBelongsVote = feedback === 'belongs' ? 1 : 0;
      const addDoesNotBelongVote = feedback === 'does_not_belong' ? 1 : 0;

      return {
        ...sighting,
        belongsVotes: Math.max(0, sighting.belongsVotes - removeBelongsVote + addBelongsVote),
        doesNotBelongVotes: Math.max(
          0,
          sighting.doesNotBelongVotes - removeDoesNotBelongVote + addDoesNotBelongVote,
        ),
        userFeedback: feedback,
      };
    });

    setCatSightings(nextSightings);

    try {
      await saveLocalCatSightings(nextSightings);
      setStorageMessage('');
    } catch {
      setStorageMessage('Je feedback is tijdelijk verwerkt, maar lokaal opslaan lukte niet.');
    }
  }

  function resetAddForm() {
    setImageUri(undefined);
    setPhotoMessage('');
  }

  function applyProfilesWithSelection(nextProfiles: CatProfile[], catId: string) {
    setCatProfiles(nextProfiles);
    setSelectedCatId(catId);
  }

  async function saveLocalState(nextProfiles: CatProfile[], nextSightings: CatSighting[]) {
    setCatSightings(nextSightings);

    try {
      await Promise.all([
        saveLocalCatProfiles(nextProfiles),
        saveLocalCatSightings(nextSightings),
      ]);
      setStorageMessage('');
    } catch {
      setStorageMessage('Deze waarneming is tijdelijk toegevoegd, maar lokaal opslaan lukte niet.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.app}>
        {screen === 'map' && (
          <MapScreen
            selectedCat={selectedCat}
            selectedCatId={selectedCatId}
            cats={catProfiles}
            sightings={catSightings}
            isLoadingSightings={isLoadingSightings}
            syncMessage={syncMessage}
            onRefresh={handleRefreshSightings}
            onSelectCat={setSelectedCatId}
            onDismissSelectedCat={handleDismissSelectedCat}
            onPhotoFeedback={handlePhotoFeedback}
          />
        )}

        {screen === 'add' && (
          <AddCatScreen
            cats={catProfiles}
            imageUri={imageUri}
            photoMessage={photoMessage}
            onChangeImageUri={setImageUri}
            onChangePhotoMessage={setPhotoMessage}
            onBack={() => setScreen('map')}
            onPreviewCat={handlePreviewCat}
            onLinkExistingCat={handleLinkExistingCat}
            onRegisterNewCat={handleRegisterNewCat}
          />
        )}

        {screen === 'profile' && (
          <PlaceholderScreen
            title="Profiel"
            text="Hier komt later je persoonlijke poezenlogboek."
            onBack={() => setScreen('map')}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            message={storageMessage}
            onBack={() => setScreen('map')}
            onResetSightings={handleResetSightings}
          />
        )}

        <BottomNav activeScreen={screen} onNavigate={setScreen} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function mergeProfiles(remoteProfiles: CatProfile[], localProfiles: CatProfile[]) {
  const profilesById = new Map(remoteProfiles.map((cat) => [cat.id, cat]));

  localProfiles.forEach((cat) => {
    profilesById.set(cat.id, cat);
  });

  return Array.from(profilesById.values());
}

function mergeSightings(remoteSightings: CatSighting[], localSightings: CatSighting[]) {
  const sightingsById = new Map(remoteSightings.map((sighting) => [sighting.id, sighting]));

  localSightings.forEach((sighting) => {
    sightingsById.set(sighting.id, {
      ...sightingsById.get(sighting.id),
      ...sighting,
    });
  });

  return Array.from(sightingsById.values());
}

function createLocalSighting(catId: string, draft: SightingDraft, spottedAt: string): CatSighting {
  return {
    id: createUuid(),
    catId,
    photoUri: draft.photoUri,
    latitude: draft.latitude,
    longitude: draft.longitude,
    locationLabel: draft.locationLabel,
    notes: draft.notes,
    spottedAt,
    status: 'active',
    belongsVotes: 0,
    doesNotBelongVotes: 0,
  };
}

function updateProfileFromSighting(
  cat: CatProfile,
  draft: SightingDraft,
  spottedAt: string,
  sightingId: string,
): CatProfile {
  return {
    ...cat,
    mainPhotoUri: draft.photoUri ?? cat.mainPhotoUri,
    lastSeenLatitude: draft.latitude,
    lastSeenLongitude: draft.longitude,
    lastSeenAt: spottedAt,
    photoIds: Array.from(new Set([...(cat.photoIds ?? []), sightingId])),
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f4ef',
  },
  app: {
    flex: 1,
    backgroundColor: '#f7f4ef',
  },
});
