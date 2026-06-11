import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, type Region } from 'react-native-maps';

import { getCatPrimaryPhotoUri, getCatProfileCoordinate } from '../data/cats';
import type { CatProfile } from '../types/cat';

type PoezenMapProps = {
  selectedCatId: string;
  cats: CatProfile[];
  onSelectCat: (catId: string) => void;
  onMapPress: () => void;
};

const AMSTERDAM_REGION: Region = {
  latitude: 52.3676,
  longitude: 4.9041,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

export default function PoezenMap({ selectedCatId, cats, onSelectCat, onMapPress }: PoezenMapProps) {
  const [region, setRegion] = useState<Region>(AMSTERDAM_REGION);
  const [permissionMessage, setPermissionMessage] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function centerOnUser() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          if (isMounted) {
            setPermissionMessage('Zet locatie aan om poezen dichter bij jou te tonen.');
            setIsLoadingLocation(false);
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          });
          setPermissionMessage('');
          setIsLoadingLocation(false);
        }
      } catch {
        if (isMounted) {
          setPermissionMessage('Locatie is nu niet beschikbaar. We starten in Amsterdam.');
          setIsLoadingLocation(false);
        }
      }
    }

    centerOnUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.mapArea}>
      <MapView
        initialRegion={AMSTERDAM_REGION}
        onRegionChangeComplete={setRegion}
        onPress={onMapPress}
        region={region}
        showsUserLocation
        style={styles.nativeMap}>
        {cats.map((cat) => {
          const coordinate = getCatProfileCoordinate(cat);

          if (!coordinate) {
            return null;
          }

          const photoUri = getCatPrimaryPhotoUri(cat);

          return (
            <Marker
              coordinate={coordinate}
              key={cat.id}
              onPress={(event) => {
                event.stopPropagation();
                onSelectCat(cat.id);
              }}>
              <View style={[styles.catPin, selectedCatId === cat.id && styles.catPinSelected]}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.catPinImage} />
                ) : (
                  <Text style={styles.catPinText}>🐱</Text>
                )}
                <View style={styles.catPinTail} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {isLoadingLocation ? (
        <View style={styles.locationPill}>
          <Text style={styles.locationPillText}>Locatie ophalen...</Text>
        </View>
      ) : null}

      {permissionMessage ? (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionTitle}>Locatie uit</Text>
          <Text style={styles.permissionText}>{permissionMessage}</Text>
        </View>
      ) : null}
    </View>
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
  nativeMap: {
    height: '100%',
    width: '100%',
  },
  catPin: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
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
  locationPill: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
    top: 16,
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  locationPillText: {
    color: '#4d5a53',
    fontSize: 13,
    fontWeight: '800',
  },
  permissionBanner: {
    backgroundColor: '#ffffff',
    borderColor: '#eadfd6',
    borderRadius: 18,
    borderWidth: 1,
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    right: 16,
    top: 16,
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  permissionTitle: {
    color: '#2f2b28',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  permissionText: {
    color: '#6c625b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
