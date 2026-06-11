import { Pressable, StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../components/screen-header';

type SettingsScreenProps = {
  message: string;
  onBack: () => void;
  onResetSightings: () => void;
};

export default function SettingsScreen({
  message,
  onBack,
  onResetSightings,
}: SettingsScreenProps) {
  return (
    <View style={styles.placeholderScreen}>
      <ScreenHeader title="Instellingen" onBack={onBack} />
      <Text style={styles.placeholderText}>Hier komen later je app-instellingen.</Text>
      <Pressable style={styles.resetButton} onPress={onResetSightings}>
        <Text style={styles.resetButtonText}>Lokale poezen wissen</Text>
      </Pressable>
      {message ? <Text style={styles.settingsMessage}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 120,
  },
  placeholderText: {
    color: '#6d6760',
    fontSize: 18,
    lineHeight: 26,
    marginTop: 12,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e1d7ce',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  resetButtonText: {
    color: '#a64e24',
    fontSize: 16,
    fontWeight: '800',
  },
  settingsMessage: {
    color: '#6d6760',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 14,
  },
});
