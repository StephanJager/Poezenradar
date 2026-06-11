import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import PoezenMap from '../components/poezen-map';
import { getCatDisplayName, getSortedCatPhotos } from '../data/cats';
import type { CatProfile, CatSighting } from '../types/cat';
import { formatLastSeen } from '../utils/date';

type MapScreenProps = {
  selectedCat?: CatProfile;
  selectedCatId: string;
  cats: CatProfile[];
  sightings: CatSighting[];
  isLoadingSightings: boolean;
  syncMessage: string;
  onSelectCat: (catId: string) => void;
  onDismissSelectedCat: () => void;
  onPhotoFeedback: (sightingId: string, feedback: 'belongs' | 'does_not_belong') => void;
  onRefresh: () => void;
};

export default function MapScreen({
  selectedCat,
  selectedCatId,
  cats,
  sightings,
  isLoadingSightings,
  syncMessage,
  onSelectCat,
  onDismissSelectedCat,
  onPhotoFeedback,
  onRefresh,
}: MapScreenProps) {
  const selectedCatPhotos = selectedCat ? getSortedCatPhotos(selectedCat, sightings) : [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Poezenradar</Text>
          <Pressable style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Ververs</Text>
          </Pressable>
        </View>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>Zoek</Text>
          <TextInput
            placeholder="Locatie of poezennaam"
            placeholderTextColor="#8a8580"
            style={styles.searchInput}
          />
        </View>
        {syncMessage ? <Text style={styles.syncMessage}>{syncMessage}</Text> : null}
      </View>

      {isLoadingSightings ? (
        <EmptyState title="Poezen ophalen" text="We laden de nieuwste actieve meldingen." />
      ) : cats.length > 0 ? (
        <PoezenMap
          selectedCatId={selectedCatId}
          cats={cats}
          onSelectCat={onSelectCat}
          onMapPress={onDismissSelectedCat}
        />
      ) : (
        <EmptyState
          title="Nog geen poezen in beeld"
          text="Voeg je eerste melding toe om de kaart te vullen."
        />
      )}

      {selectedCat ? (
        <View style={styles.catCard}>
          <Pressable
            accessibilityLabel="Sluit kattenprofiel"
            onPress={onDismissSelectedCat}
            style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardEyebrow}>Geselecteerde poes</Text>
              <Text style={styles.cardTitle}>{getCatDisplayName(selectedCat)}</Text>
            </View>
            {selectedCat.lastSeenAt ? (
              <Text style={styles.cardTime}>{formatLastSeen(selectedCat.lastSeenAt)}</Text>
            ) : null}
          </View>
          {selectedCat.homeLocationLabel ? (
            <Text style={styles.cardLocation}>{selectedCat.homeLocationLabel}</Text>
          ) : null}
          {selectedCatPhotos.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.galleryContent}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {selectedCatPhotos.map((photo) => {
                const isUncertain = photo.doesNotBelongVotes > photo.belongsVotes;

                return (
                  <View style={styles.galleryItem} key={photo.id}>
                    <Image source={{ uri: photo.uri }} style={styles.galleryImage} />
                    {isUncertain ? <Text style={styles.uncertainBadge}>Nog onzeker</Text> : null}
                    {photo.isFeedbackEnabled ? (
                      <View style={styles.feedbackRow}>
                        <Pressable
                          onPress={() => onPhotoFeedback(photo.id, 'belongs')}
                          style={[
                            styles.feedbackButton,
                            photo.userFeedback === 'belongs' && styles.feedbackButtonActive,
                          ]}>
                          <Text style={styles.feedbackButtonText}>Hoort bij deze poes</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => onPhotoFeedback(photo.id, 'does_not_belong')}
                          style={[
                            styles.feedbackButton,
                            photo.userFeedback === 'does_not_belong' &&
                              styles.feedbackButtonWarning,
                          ]}>
                          <Text style={styles.feedbackButtonText}>Hoort niet bij deze poes</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.cardPhotoPlaceholder}>
              <Text style={styles.cardPhotoPlaceholderText}>Geen foto beschikbaar</Text>
            </View>
          )}
          {selectedCat.description ? (
            <Text style={styles.cardNote}>{selectedCat.description}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    paddingBottom: 116,
  },
  header: {
    gap: 14,
    marginBottom: 14,
  },
  titleRow: {
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
  refreshButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  refreshButtonText: {
    color: '#4f4a45',
    fontSize: 13,
    fontWeight: '900',
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
  },
  searchIcon: {
    color: '#7b736c',
    fontSize: 13,
    fontWeight: '900',
  },
  searchInput: {
    color: '#242220',
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  syncMessage: {
    color: '#706a64',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
    padding: 24,
  },
  emptyStateTitle: {
    color: '#242220',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyStateText: {
    color: '#706a64',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  catCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 26,
    borderWidth: 1,
    bottom: 116,
    gap: 8,
    left: 22,
    padding: 16,
    position: 'absolute',
    right: 22,
    shadowColor: '#1f2933',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f4efe9',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 30,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#4f4a45',
    fontSize: 24,
    lineHeight: 26,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    color: '#8a827a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#242220',
    fontSize: 24,
    fontWeight: '900',
  },
  cardLocation: {
    color: '#4f4a45',
    fontSize: 15,
    fontWeight: '800',
  },
  galleryContent: {
    gap: 10,
    paddingVertical: 4,
  },
  galleryItem: {
    backgroundColor: '#f9f7f4',
    borderColor: '#ebe3dc',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 8,
    width: 210,
  },
  galleryImage: {
    borderRadius: 14,
    height: 128,
    width: '100%',
  },
  uncertainBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff2e4',
    borderRadius: 999,
    color: '#a64e24',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  feedbackRow: {
    gap: 6,
  },
  feedbackButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ebe3dc',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  feedbackButtonActive: {
    borderColor: '#4d8b68',
    backgroundColor: '#edf7f0',
  },
  feedbackButtonWarning: {
    borderColor: '#d97445',
    backgroundColor: '#fff2e4',
  },
  feedbackButtonText: {
    color: '#4f4a45',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardPhotoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#f7f4ef',
    borderColor: '#ebe3dc',
    borderRadius: 16,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    marginVertical: 4,
    width: '100%',
  },
  cardPhotoPlaceholderText: {
    color: '#8a827a',
    fontSize: 13,
    fontWeight: '800',
  },
  cardNote: {
    color: '#6d6760',
    fontSize: 14,
    lineHeight: 20,
  },
  cardTime: {
    color: '#ff7f2f',
    fontSize: 13,
    fontWeight: '900',
    paddingTop: 3,
  },
});
