import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import ScreenHeader from '../components/screen-header';
import { getCatDisplayName, getCatPrimaryPhotoUri, getCatProfileCoordinate } from '../data/cats';
import type { CatProfile } from '../types/cat';
import { formatDistance, getDistanceMeters, type Coordinate } from '../utils/geo';

type SightingDraft = {
  photoUri?: string;
  latitude: number;
  longitude: number;
  locationLabel?: string;
};

type NewCatDraft = SightingDraft & {
  name?: string;
  description?: string;
  notes?: string;
};

type AddCatScreenProps = {
  cats: CatProfile[];
  imageUri?: string;
  photoMessage: string;
  onChangeImageUri: (value: string | undefined) => void;
  onChangePhotoMessage: (value: string) => void;
  onBack: () => void;
  onPreviewCat: (catId: string) => void;
  onLinkExistingCat: (catId: string, draft: SightingDraft) => void;
  onRegisterNewCat: (draft: NewCatDraft) => void;
};

const NEARBY_RADIUS_METERS = 1000;

export default function AddCatScreen({
  cats,
  imageUri,
  photoMessage,
  onChangeImageUri,
  onChangePhotoMessage,
  onBack,
  onPreviewCat,
  onLinkExistingCat,
  onRegisterNewCat,
}: AddCatScreenProps) {
  const didAutoOpenCamera = useRef(false);
  const [showPhotoChoices, setShowPhotoChoices] = useState(false);
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatNotes, setNewCatNotes] = useState('');

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  useEffect(() => {
    if (didAutoOpenCamera.current || imageUri) {
      return;
    }

    didAutoOpenCamera.current = true;

    if (Platform.OS === 'web') {
      setShowPhotoChoices(true);
      return;
    }

    handleTakePhoto();
  }, [imageUri]);

  const nearbySuggestions = useMemo(() => {
    if (!location) {
      return [];
    }

    return cats
      .map((cat) => {
        const coordinate = getCatProfileCoordinate(cat);
        if (!coordinate) {
          return null;
        }

        return {
          cat,
          distanceMeters: getDistanceMeters(location, coordinate),
        };
      })
      .filter((suggestion): suggestion is { cat: CatProfile; distanceMeters: number } => {
        return Boolean(suggestion && suggestion.distanceMeters <= NEARBY_RADIUS_METERS);
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 5);
  }, [cats, location]);

  async function loadCurrentLocation() {
    setIsLoadingLocation(true);
    setLocationMessage('');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocation(null);
        setLocationMessage('Locatie is nodig om de poes op de kaart te zetten.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLocationMessage('Locatie automatisch bepaald.');
    } catch {
      setLocation(null);
      setLocationMessage('Locatie ophalen lukte niet. Probeer het nog een keer.');
    } finally {
      setIsLoadingLocation(false);
    }
  }

  async function handleTakePhoto() {
    if (Platform.OS === 'web') {
      // Browser camera support varies, so web keeps the picker path available and non-blocking.
      onChangePhotoMessage('Op web werkt de camera beperkt. Kies een foto uit je bibliotheek.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      onChangePhotoMessage('Camera-toegang is nodig om een poezenfoto te maken.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      onChangeImageUri(result.assets[0].uri);
      onChangePhotoMessage('');
      setShowPhotoChoices(false);
    } else {
      onChangePhotoMessage('Geen foto gemaakt. Open de camera opnieuw of kies een foto.');
      setShowPhotoChoices(true);
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onChangePhotoMessage('Foto-toegang is nodig om een poezenfoto te kiezen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      onChangeImageUri(result.assets[0].uri);
      onChangePhotoMessage('');
      setShowPhotoChoices(false);
    }
  }

  function getSightingDraft(): SightingDraft | null {
    if (!imageUri) {
      onChangePhotoMessage('Maak of kies eerst een foto van de poes.');
      return null;
    }

    if (!location) {
      setLocationMessage('Locatie is nodig om deze waarneming op te slaan.');
      return null;
    }

    return {
      photoUri: imageUri,
      latitude: location.latitude,
      longitude: location.longitude,
      locationLabel: 'Locatie automatisch bepaald',
    };
  }

  function handleLinkExistingCat(catId: string) {
    const draft = getSightingDraft();
    if (!draft) {
      return;
    }

    onLinkExistingCat(catId, draft);
  }

  function handleRegisterNewCat() {
    const draft = getSightingDraft();
    if (!draft) {
      return;
    }

    onRegisterNewCat({
      ...draft,
      name: newCatName.trim() || undefined,
      description: newCatDescription.trim() || undefined,
      notes: newCatNotes.trim() || undefined,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.formScreen} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Poes gespot" onBack={onBack} />

      <View style={styles.formPanel}>
        <View style={styles.photoPicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoText}>Foto toevoegen</Text>
              <Text style={styles.photoHint}>
                Maak een snelle foto of kies er een uit je bibliotheek.
              </Text>
            </View>
          )}

          <Pressable
            style={styles.photoButton}
            onPress={() => setShowPhotoChoices((current) => !current)}>
            <Text style={styles.photoButtonText}>Maak of kies foto</Text>
          </Pressable>

          {showPhotoChoices ? (
            <View style={styles.photoChoices}>
              <Pressable style={styles.photoChoiceButton} onPress={handleTakePhoto}>
                <Text style={styles.photoChoiceText}>Maak foto</Text>
              </Pressable>
              <Pressable style={styles.photoChoiceButton} onPress={handlePickPhoto}>
                <Text style={styles.photoChoiceText}>Bibliotheek</Text>
              </Pressable>
            </View>
          ) : null}

          {photoMessage ? <Text style={styles.messageText}>{photoMessage}</Text> : null}
        </View>

        <View style={styles.locationPanel}>
          <View>
            <Text style={styles.label}>Locatie automatisch bepaald</Text>
            <Text style={styles.helperText}>
              {isLoadingLocation ? 'Locatie ophalen...' : locationMessage}
            </Text>
            {location ? (
              <Text style={styles.coordinateText}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            ) : null}
          </View>
          {!location && !isLoadingLocation ? (
            <Pressable style={styles.retryButton} onPress={loadCurrentLocation}>
              <Text style={styles.retryButtonText}>Opnieuw proberen</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.formPanel}>
        <Text style={styles.sectionTitle}>Welke kat is dit?</Text>

        {!location ? (
          <Text style={styles.helperText}>
            Geef locatie-toegang om katten in de buurt te kunnen voorstellen.
          </Text>
        ) : nearbySuggestions.length > 0 ? (
          nearbySuggestions.map(({ cat, distanceMeters }) => (
            <View style={styles.suggestionCard} key={cat.id}>
              <Pressable style={styles.suggestionPreview} onPress={() => onPreviewCat(cat.id)}>
                {getCatPrimaryPhotoUri(cat) ? (
                  <Image source={{ uri: getCatPrimaryPhotoUri(cat) }} style={styles.suggestionImage} />
                ) : (
                  <View style={styles.suggestionPlaceholder}>
                    <Text style={styles.suggestionPlaceholderText}>🐱</Text>
                  </View>
                )}
              </Pressable>
              <Pressable style={styles.suggestionText} onPress={() => onPreviewCat(cat.id)}>
                <Text style={styles.suggestionTitle}>{getCatDisplayName(cat)}</Text>
                {cat.description || cat.homeLocationLabel ? (
                  <Text style={styles.helperText} numberOfLines={2}>
                    {cat.description ?? cat.homeLocationLabel}
                  </Text>
                ) : null}
                <Text style={styles.helperText}>{formatDistance(distanceMeters)} hiervandaan</Text>
              </Pressable>
              <Pressable
                disabled={!location}
                onPress={() => handleLinkExistingCat(cat.id)}
                style={[styles.suggestionButton, !location && styles.disabledButton]}>
                <Text style={styles.suggestionButtonText}>Dit is deze kat</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.helperText}>Geen katten in de buurt gevonden.</Text>
        )}

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setShowNewCatForm((current) => !current)}>
          <Text style={styles.secondaryButtonText}>Nieuwe poes registreren</Text>
        </Pressable>
      </View>

      {showNewCatForm ? (
        <View style={styles.formPanel}>
          <LabeledInput
            label="Naam van de poes, optioneel"
            onChangeText={setNewCatName}
            placeholder="Naam nog onbekend"
            value={newCatName}
          />
          <LabeledInput
            label="Beschrijving, optioneel"
            multiline
            onChangeText={setNewCatDescription}
            placeholder="Kleur, vacht, halsband of herkenningspunt"
            value={newCatDescription}
          />
          <LabeledInput
            label="Notities, optioneel"
            multiline
            onChangeText={setNewCatNotes}
            placeholder="Wat viel je op?"
            value={newCatNotes}
          />

          <Pressable
            disabled={!location}
            style={[styles.saveButton, !location && styles.disabledButton]}
            onPress={handleRegisterNewCat}>
            <Text style={styles.saveButtonText}>Nieuwe poes opslaan</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function LabeledInput({
  label,
  multiline,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9d938a"
        style={[styles.input, multiline && styles.notesInput]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formScreen: {
    gap: 16,
    padding: 16,
    paddingBottom: 138,
  },
  formPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 26,
    borderWidth: 1,
    gap: 16,
    padding: 14,
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  photoPicker: {
    gap: 12,
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#f7f4ef',
    borderColor: '#e4ddd5',
    borderRadius: 22,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 184,
    justifyContent: 'center',
    padding: 20,
  },
  photoPreview: {
    borderRadius: 22,
    height: 220,
    width: '100%',
  },
  photoText: {
    color: '#242220',
    fontSize: 18,
    fontWeight: '900',
  },
  photoHint: {
    color: '#746d66',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  photoButton: {
    alignItems: 'center',
    backgroundColor: '#242220',
    borderRadius: 16,
    paddingVertical: 15,
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  photoChoices: {
    flexDirection: 'row',
    gap: 10,
  },
  photoChoiceButton: {
    alignItems: 'center',
    backgroundColor: '#f9f7f4',
    borderColor: '#ebe3dc',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  photoChoiceText: {
    color: '#4f4a45',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  locationPanel: {
    alignItems: 'center',
    backgroundColor: '#f9f7f4',
    borderColor: '#ebe3dc',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 14,
  },
  retryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#4f4a45',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#242220',
    fontSize: 22,
    fontWeight: '900',
  },
  suggestionCard: {
    alignItems: 'center',
    backgroundColor: '#f9f7f4',
    borderColor: '#ebe3dc',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  suggestionText: {
    flex: 1,
    gap: 3,
  },
  suggestionPreview: {
    borderRadius: 16,
  },
  suggestionImage: {
    borderRadius: 16,
    height: 58,
    width: 58,
  },
  suggestionPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 16,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  suggestionPlaceholderText: {
    fontSize: 28,
  },
  suggestionTitle: {
    color: '#242220',
    fontSize: 16,
    fontWeight: '900',
  },
  suggestionButton: {
    backgroundColor: '#242220',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ff7f2f',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#a64e24',
    fontSize: 16,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.45,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#4f4a45',
    fontSize: 15,
    fontWeight: '900',
  },
  helperText: {
    color: '#746d66',
    fontSize: 14,
    lineHeight: 20,
  },
  coordinateText: {
    color: '#9d938a',
    fontSize: 12,
    marginTop: 3,
  },
  messageText: {
    color: '#a64e24',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#f9f7f4',
    borderColor: '#ebe3dc',
    borderRadius: 14,
    borderWidth: 1,
    color: '#242220',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 112,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#ff7f2f',
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: '#a64e24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
});
