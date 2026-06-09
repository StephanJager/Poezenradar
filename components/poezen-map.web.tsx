import { Pressable, StyleSheet, Text, View } from 'react-native';

type CatSighting = {
  id: string;
  catName: string;
  latitude: number;
  longitude: number;
};

type PoezenMapProps = {
  selectedCatId: string;
  sightings: CatSighting[];
  onSelectCat: (catId: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function coordinateToFakeMapPosition(cat: CatSighting) {
  return {
    x: clamp(((cat.longitude - 4.84) / 0.1) * 100, 10, 90),
    y: clamp(((52.39 - cat.latitude) / 0.06) * 100, 10, 90),
  };
}

export default function PoezenMap({ selectedCatId, sightings, onSelectCat }: PoezenMapProps) {
  return (
    <View style={styles.mapArea}>
      <View style={[styles.mapBlob, styles.mapBlobOne]} />
      <View style={[styles.mapBlob, styles.mapBlobTwo]} />
      <View style={styles.mapRoad} />
      <View style={[styles.mapRoad, styles.mapRoadAlt]} />
      {sightings.map((cat) => {
        const position = coordinateToFakeMapPosition(cat);

        return (
          <Pressable
            accessibilityLabel={`${cat.catName} op de kaart`}
            key={cat.id}
            onPress={() => onSelectCat(cat.id)}
            style={[
              styles.catPin,
              {
                left: `${position.x}%`,
                top: `${position.y}%`,
              },
              selectedCatId === cat.id && styles.catPinSelected,
            ]}>
            <Text style={styles.catPinText}>🐱</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mapArea: {
    flex: 1,
    minHeight: 360,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: '#d9efe4',
    borderColor: '#badbca',
    borderWidth: 1,
    position: 'relative',
  },
  mapBlob: {
    position: 'absolute',
    backgroundColor: '#c4e5d4',
    borderRadius: 999,
  },
  mapBlobOne: {
    height: 220,
    left: -42,
    top: 42,
    width: 220,
  },
  mapBlobTwo: {
    bottom: -30,
    height: 230,
    right: -58,
    width: 250,
  },
  mapRoad: {
    position: 'absolute',
    backgroundColor: '#f7efe3',
    height: 34,
    left: -24,
    right: -24,
    top: '48%',
    transform: [{ rotate: '-16deg' }],
  },
  mapRoadAlt: {
    top: '34%',
    transform: [{ rotate: '32deg' }],
  },
  catPin: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#f0a64f',
    borderRadius: 24,
    borderWidth: 3,
    height: 48,
    justifyContent: 'center',
    marginLeft: -24,
    marginTop: -24,
    position: 'absolute',
    shadowColor: '#5e3a22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    width: 48,
  },
  catPinSelected: {
    backgroundColor: '#ffe0b5',
    borderColor: '#d86931',
    transform: [{ scale: 1.08 }],
  },
  catPinText: {
    fontSize: 24,
  },
});
