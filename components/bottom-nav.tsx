import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Screen } from '../types/cat';

type BottomNavProps = {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
};

export default function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      <Pressable
        onPress={() => onNavigate('profile')}
        style={[styles.navButton, activeScreen === 'profile' && styles.navButtonActive]}>
        <Ionicons name="person-outline" size={21} color="#6d6760" />
        <Text style={styles.navLabel}>Profiel</Text>
      </Pressable>

      <Pressable onPress={() => onNavigate('add')} style={styles.cameraButton}>
        <Ionicons name="camera" size={25} color="#ffffff" />
        <Text style={styles.cameraLabel}>Poes gespot</Text>
      </Pressable>

      <Pressable
        onPress={() => onNavigate('settings')}
        style={[styles.navButton, activeScreen === 'settings' && styles.navButtonActive]}>
        <Ionicons name="settings-outline" size={21} color="#6d6760" />
        <Text style={styles.navLabel}>Instellingen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 30,
    borderWidth: 1,
    bottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'absolute',
    right: 20,
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 20,
    minWidth: 88,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  navButtonActive: {
    backgroundColor: '#f4efe9',
  },
  navLabel: {
    color: '#4f4a45',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: '#242220',
    borderColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 3,
    minWidth: 112,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    transform: [{ translateY: -18 }],
  },
  cameraLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
