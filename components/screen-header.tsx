import { Pressable, StyleSheet, Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  onBack: () => void;
};

export default function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Kaart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#242220',
    fontSize: 32,
    fontWeight: '900',
  },
  backButton: {
    backgroundColor: '#ffffff',
    borderColor: '#e7dfd8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  backButtonText: {
    color: '#4f4a45',
    fontSize: 14,
    fontWeight: '900',
  },
});
