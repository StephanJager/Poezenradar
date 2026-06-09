import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import PoezenMap from '../../components/poezen-map';

type CatSighting = {
  id: string;
  catName: string;
  locationLabel: string;
  notes: string;
  spottedAt: string;
  latitude: number;
  longitude: number;
};

type Screen = 'map' | 'add' | 'profile' | 'settings';

const initialSightings: CatSighting[] = [
  {
    id: 'mila',
    catName: 'Mila',
    locationLabel: 'Vondelpark, Amsterdam',
    notes: 'Zat heel rustig naast de vijver.',
    spottedAt: '10 min geleden',
    latitude: 52.358,
    longitude: 4.8686,
  },
  {
    id: 'sokje',
    catName: 'Sokje',
    locationLabel: 'Kinkerstraat',
    notes: 'Witte pootjes, erg nieuwsgierig.',
    spottedAt: '24 min geleden',
    latitude: 52.3643,
    longitude: 4.8666,
  },
  {
    id: 'noortje',
    catName: 'Noortje',
    locationLabel: 'Da Costabuurt',
    notes: 'Lag in een zonnige vensterbank.',
    spottedAt: '1 uur geleden',
    latitude: 52.3661,
    longitude: 4.8753,
  },
  {
    id: 'tijger',
    catName: 'Tijger',
    locationLabel: 'Overtoom',
    notes: 'Oranje streepjeskat met veel praatjes.',
    spottedAt: '2 uur geleden',
    latitude: 52.3613,
    longitude: 4.8721,
  },
];

const AMSTERDAM_CENTER = {
  latitude: 52.3676,
  longitude: 4.9041,
};

function getGeneratedCoordinate(index: number) {
  return {
    latitude: AMSTERDAM_CENTER.latitude + ((index % 5) - 2) * 0.004,
    longitude: AMSTERDAM_CENTER.longitude + (((index * 2) % 5) - 2) * 0.005,
  };
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('map');
  const [sightings, setSightings] = useState<CatSighting[]>(initialSightings);
  const [selectedCatId, setSelectedCatId] = useState(initialSightings[0].id);
  const [catName, setCatName] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [notes, setNotes] = useState('');

  const selectedCat = useMemo(
    () => sightings.find((cat) => cat.id === selectedCatId) ?? sightings[0],
    [selectedCatId, sightings],
  );

  function handleSaveSighting() {
    const index = sightings.length;
    const newSighting: CatSighting = {
      id: `cat-${Date.now()}`,
      catName: catName.trim() || 'Onbekende poes',
      locationLabel: locationLabel.trim() || 'Locatie volgt later',
      notes: notes.trim() || 'Geen notities toegevoegd.',
      spottedAt: 'Zojuist gespot',
      ...getGeneratedCoordinate(index),
    };

    setSightings((current) => [...current, newSighting]);
    setSelectedCatId(newSighting.id);
    setCatName('');
    setLocationLabel('');
    setNotes('');
    setScreen('map');
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
            sightings={sightings}
            onSelectCat={setSelectedCatId}
          />
        )}

        {screen === 'add' && (
          <AddCatScreen
            catName={catName}
            locationLabel={locationLabel}
            notes={notes}
            onChangeCatName={setCatName}
            onChangeLocationLabel={setLocationLabel}
            onChangeNotes={setNotes}
            onBack={() => setScreen('map')}
            onSave={handleSaveSighting}
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
          <PlaceholderScreen
            title="Instellingen"
            text="Hier komen later je app-instellingen."
            onBack={() => setScreen('map')}
          />
        )}

        <BottomNav activeScreen={screen} onNavigate={setScreen} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MapScreen({
  selectedCat,
  selectedCatId,
  sightings,
  onSelectCat,
}: {
  selectedCat: CatSighting;
  selectedCatId: string;
  sightings: CatSighting[];
  onSelectCat: (catId: string) => void;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Poezenradar</Text>
        <TextInput
          placeholder="Zoek op locatie of poezennaam"
          placeholderTextColor="#8b8179"
          style={styles.searchInput}
        />
      </View>

      <PoezenMap
        selectedCatId={selectedCatId}
        sightings={sightings}
        onSelectCat={onSelectCat}
      />

      <View style={styles.catCard}>
        <View>
          <Text style={styles.cardEyebrow}>Laatste spot</Text>
          <Text style={styles.cardTitle}>{selectedCat.catName}</Text>
        </View>
        <Text style={styles.cardLocation}>{selectedCat.locationLabel}</Text>
        <Text style={styles.cardNote}>{selectedCat.notes}</Text>
        <Text style={styles.cardTime}>{selectedCat.spottedAt}</Text>
      </View>
    </View>
  );
}

function AddCatScreen({
  catName,
  locationLabel,
  notes,
  onChangeCatName,
  onChangeLocationLabel,
  onChangeNotes,
  onBack,
  onSave,
}: {
  catName: string;
  locationLabel: string;
  notes: string;
  onChangeCatName: (value: string) => void;
  onChangeLocationLabel: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.formScreen} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Poes gespot" onBack={onBack} />

      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoText}>Foto-placeholder</Text>
      </View>

      <LabeledInput
        label="Naam van de poes"
        onChangeText={onChangeCatName}
        placeholder="Optioneel"
        value={catName}
      />
      <LabeledInput
        label="Locatie"
        onChangeText={onChangeLocationLabel}
        placeholder="Bijvoorbeeld: Vondelpark"
        value={locationLabel}
      />
      <LabeledInput
        label="Notities"
        multiline
        onChangeText={onChangeNotes}
        placeholder="Wat viel je op?"
        value={notes}
      />

      <Pressable style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Opslaan</Text>
      </Pressable>
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

function PlaceholderScreen({
  title,
  text,
  onBack,
}: {
  title: string;
  text: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.placeholderScreen}>
      <ScreenHeader title={title} onBack={onBack} />
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Kaart</Text>
      </Pressable>
    </View>
  );
}

function BottomNav({
  activeScreen,
  onNavigate,
}: {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      <Pressable
        onPress={() => onNavigate('profile')}
        style={[styles.navButton, activeScreen === 'profile' && styles.navButtonActive]}>
        <Text style={styles.navIcon}>♡</Text>
        <Text style={styles.navLabel}>Profiel</Text>
      </Pressable>

      <Pressable onPress={() => onNavigate('add')} style={styles.cameraButton}>
        <Text style={styles.cameraIcon}>📷</Text>
        <Text style={styles.cameraLabel}>Poes gespot</Text>
      </Pressable>

      <Pressable
        onPress={() => onNavigate('settings')}
        style={[styles.navButton, activeScreen === 'settings' && styles.navButtonActive]}>
        <Text style={styles.navIcon}>⚙</Text>
        <Text style={styles.navLabel}>Instellingen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff8f2',
  },
  app: {
    flex: 1,
    backgroundColor: '#fff8f2',
  },
  screen: {
    flex: 1,
    padding: 20,
    paddingBottom: 116,
  },
  header: {
    gap: 16,
    marginBottom: 18,
  },
  title: {
    color: '#34251e',
    fontSize: 34,
    fontWeight: '800',
  },
  screenHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: '#ffffff',
    borderColor: '#f0ded1',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#5d4438',
    fontSize: 14,
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#f0ded1',
    borderRadius: 18,
    borderWidth: 1,
    color: '#34251e',
    fontSize: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#7a4a2d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  catCard: {
    backgroundColor: '#ffffff',
    borderColor: '#f0ded1',
    borderRadius: 24,
    borderWidth: 1,
    bottom: 122,
    gap: 7,
    left: 36,
    padding: 18,
    position: 'absolute',
    right: 36,
    shadowColor: '#7a4a2d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
  },
  cardEyebrow: {
    color: '#b36b3a',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#34251e',
    fontSize: 24,
    fontWeight: '800',
  },
  cardLocation: {
    color: '#6c5144',
    fontSize: 15,
    fontWeight: '700',
  },
  cardNote: {
    color: '#6f625a',
    fontSize: 14,
    lineHeight: 20,
  },
  cardTime: {
    color: '#b36b3a',
    fontSize: 13,
    fontWeight: '700',
  },
  formScreen: {
    gap: 18,
    padding: 20,
    paddingBottom: 138,
  },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#fff2e4',
    borderColor: '#f1cda7',
    borderRadius: 26,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 190,
    justifyContent: 'center',
  },
  photoText: {
    color: '#9c6b45',
    fontSize: 18,
    fontWeight: '800',
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#4b3429',
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#f0ded1',
    borderRadius: 16,
    borderWidth: 1,
    color: '#34251e',
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
    backgroundColor: '#d86931',
    borderRadius: 18,
    marginTop: 4,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    paddingBottom: 120,
  },
  placeholderText: {
    color: '#6f625a',
    fontSize: 18,
    lineHeight: 26,
    marginTop: 12,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#f0ded1',
    borderRadius: 28,
    borderWidth: 1,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    position: 'absolute',
    right: 20,
    shadowColor: '#7a4a2d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 18,
    minWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  navButtonActive: {
    backgroundColor: '#fff2e4',
  },
  navIcon: {
    color: '#7b5c4d',
    fontSize: 21,
  },
  navLabel: {
    color: '#5d4438',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: '#34251e',
    borderRadius: 26,
    minWidth: 108,
    paddingHorizontal: 14,
    paddingVertical: 12,
    transform: [{ translateY: -16 }],
  },
  cameraIcon: {
    fontSize: 24,
  },
  cameraLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
