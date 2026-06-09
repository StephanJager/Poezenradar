import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, type Region } from 'react-native-maps';

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

const AMSTERDAM_REGION: Region = {
  latitude: 52.3676,
  longitude: 4.9041,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

export default function PoezenMap({ selectedCatId, sightings, onSelectCat }: PoezenMapProps) {
  const [region, setRegion] = useState<Region>(AMSTERDAM_REGION);
  const [permissionMessage, setPermissionMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function centerOnUser() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          if (isMounted) {
            setPermissionMessage('Geef locatie-toegang om poezen bij jou in de buurt te zien.');
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
        }
      } catch {
        if (isMounted) {
          setPermissionMessage('Locatie is nu niet beschikbaar. We tonen Amsterdam als startpunt.');
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
        region={region}
        showsUserLocation
        style={styles.nativeMap}>
        {sightings.map((cat) => (
          <Marker
            coordinate={{ latitude: cat.latitude, longitude: cat.longitude }}
            key={cat.id}
            onPress={() => onSelectCat(cat.id)}>
            <View style={[styles.catPin, selectedCatId === cat.id && styles.catPinSelected]}>
              <Text style={styles.catPinText}>🐱</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {permissionMessage ? (
        <View style={styles.permissionBanner}>
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
    borderRadius: 30,
    backgroundColor: '#d9efe4',
    borderColor: '#badbca',
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
    borderColor: '#f0a64f',
    borderRadius: 24,
    borderWidth: 3,
    height: 48,
    justifyContent: 'center',
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
  permissionBanner: {
    backgroundColor: '#ffffff',
    borderColor: '#f0ded1',
    borderRadius: 18,
    borderWidth: 1,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    right: 16,
    top: 16,
    shadowColor: '#7a4a2d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  permissionText: {
    color: '#6c5144',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
