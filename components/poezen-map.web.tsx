import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCatDisplayName, getCatPrimaryPhotoUri, getCatProfileCoordinate } from '../data/cats';
import type { CatProfile } from '../types/cat';

type PoezenMapProps = {
  selectedCatId: string;
  cats: CatProfile[];
  onSelectCat: (catId: string) => void;
  onMapPress: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function coordinateToFakeMapPosition(cat: CatProfile) {
  const coordinate = getCatProfileCoordinate(cat);

  if (!coordinate) {
    return null;
  }

  return {
    x: clamp(((coordinate.longitude - 4.84) / 0.1) * 100, 10, 90),
    y: clamp(((52.39 - coordinate.latitude) / 0.06) * 100, 10, 90),
  };
}

export default function PoezenMap({ selectedCatId, cats, onSelectCat, onMapPress }: PoezenMapProps) {
  return (
    <Pressable style={styles.mapArea} onPress={onMapPress}>
      <View style={[styles.mapBlob, styles.mapBlobOne]} />
      <View style={[styles.mapBlob, styles.mapBlobTwo]} />
      <View style={styles.mapRoad} />
      <View style={[styles.mapRoad, styles.mapRoadAlt]} />
      {cats.map((cat) => {
        const position = coordinateToFakeMapPosition(cat);
        if (!position) {
          return null;
        }
        const photoUri = getCatPrimaryPhotoUri(cat);

        return (
          <Pressable
            accessibilityLabel={`${getCatDisplayName(cat)} op de kaart`}
            key={cat.id}
            onPress={(event) => {
              event.stopPropagation();
              onSelectCat(cat.id);
            }}
            style={[
              styles.catPin,
              {
                left: `${position.x}%`,
                top: `${position.y}%`,
              },
              selectedCatId === cat.id && styles.catPinSelected,
            ]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.catPinImage} />
            ) : (
              <Text style={styles.catPinText}>🐱</Text>
            )}
            <View style={styles.catPinTail} />
          </Pressable>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mapArea: {
    flex: 1,
    minHeight: 360,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#e8efe9',
    borderColor: '#d7ded9',
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
    borderColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    marginLeft: -22,
    marginTop: -22,
    position: 'absolute',
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    width: 44,
  },
  catPinSelected: {
    backgroundColor: '#ff8f3d',
    borderColor: '#ffffff',
    transform: [{ scale: 1.12 }],
  },
  catPinImage: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  catPinText: {
    fontSize: 23,
  },
  catPinTail: {
    backgroundColor: '#ffffff',
    bottom: -4,
    height: 10,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
});
