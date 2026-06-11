import { StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../components/screen-header';

type PlaceholderScreenProps = {
  title: string;
  text: string;
  onBack: () => void;
};

export default function PlaceholderScreen({ title, text, onBack }: PlaceholderScreenProps) {
  return (
    <View style={styles.placeholderScreen}>
      <ScreenHeader title={title} onBack={onBack} />
      <Text style={styles.placeholderText}>{text}</Text>
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
});
