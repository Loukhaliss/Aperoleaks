import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useUserStore } from '../../Store/useUserStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';

const socket = io('http://192.168.1.131:3000');

export default function RoundScreen() {
  const { pseudo } = useUserStore();
  const { code } = useLocalSearchParams();
  const router = useRouter();

  const [media, setMedia] = useState(null);
  const [players, setPlayers] = useState([]);
  const [fullscreen, setFullscreen] = useState(true);
  const [denouncedBy, setDenouncedBy] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);

  const [showIntro, setShowIntro] = useState(true);
  const introOpacity = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (!code) return;

    socket.emit('get_current_round', code);

    socket.on('current_round', async (data) => {
      setPlayers(data.players);
      setRoundNumber(data.roundNumber || 1);

      setShowIntro(true);
      introOpacity.setValue(1);

      if (data.roundNumber === 1) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sounds/gong.wav')
          );
          await sound.playAsync();
        } catch (e) {
          console.warn("Erreur lecture gong:", e);
        }
      }

      setTimeout(() => {
        Animated.timing(introOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          setShowIntro(false);
          setMedia(data.media);
        });
      }, data.roundNumber === 1 ? 2500 : 2000);
    });

    socket.on('denounced', ({ from }) => {
      setDenouncedBy((prev) => [...prev, from]);
    });

    socket.on('vote_phase', () => {
      if (!code) return;
      router.replace(`/vote?code=${code}`);
    });

    return () => {
      socket.off('current_round');
      socket.off('denounced');
      socket.off('vote_phase');
    };
  }, [code, router]);

  const handleDenounce = (target) => {
    socket.emit('denounce', { code, from: pseudo, target });
  };

  const isHost = players.length > 0 && players[0].pseudo === pseudo;

  if (!media)
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingIntroText}>
          {roundNumber === 1 ? "Ouverture de l'arène 🏟️" : "Manche suivante ⚔️"}
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {showIntro && (
        <Animated.View style={[styles.introOverlay, { opacity: introOpacity }]}>
          <Text style={styles.introText}>
            {roundNumber === 1
              ? "Ouverture de l'arène 🏟️"
              : 'Nouvelle manche, préparez-vous !'}
          </Text>
        </Animated.View>
      )}

      <Modal visible={fullscreen} animationType="slide">
        <View style={styles.fullscreenMedia}>
          {media.type === 'video' ? (
            <Video
              source={{ uri: media.uri }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="contain"
              shouldPlay
              useNativeControls
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Image
              source={{ uri: media.uri }}
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            />
          )}
          <Pressable style={styles.backIcon} onPress={() => setFullscreen(false)}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </Pressable>
        </View>
      </Modal>

      <Pressable onPress={() => setFullscreen(true)} style={styles.previewContainer}>
        {media.type === 'video' ? (
          <Video
            source={{ uri: media.uri }}
            style={styles.preview}
            useNativeControls
            resizeMode="cover"
          />
        ) : (
          <Image source={{ uri: media.uri }} style={styles.preview} />
        )}
      </Pressable>

      <ScrollView contentContainerStyle={styles.playersList}>
        {players.map((player, i) => (
          <View key={i} style={styles.playerBlock}>
            {player.avatar ? (
              <Image source={{ uri: player.avatar }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle-outline" size={60} color="#fff" />
            )}
            <Text style={styles.pseudo}>{player.pseudo}</Text>
            <TouchableOpacity
              onPress={() => handleDenounce(player.pseudo)}
              style={styles.denyButton}
            >
              <Text style={styles.denyText}>Dénoncer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {isHost && (
        <Pressable
          style={styles.manualButton}
          onPress={() => {
            if (!code) return;
            router.replace(`/vote?code=${code}`);
          }}
        >
          <Text style={styles.manualButtonText}>Aller aux Votes</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e1230', padding: 20 },
  fullscreenMedia: { flex: 1, backgroundColor: '#000' },
  backIcon: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#0008',
    padding: 8,
    borderRadius: 24,
  },
  previewContainer: { height: 180, marginBottom: 20 },
  preview: { width: '100%', height: '100%', borderRadius: 12 },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  playerBlock: { alignItems: 'center', margin: 10 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  pseudo: { color: '#fff', marginTop: 4 },
  denyButton: {
    backgroundColor: '#f2bddb',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  denyText: { color: '#0e1230', fontWeight: 'bold' },
  manualButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#f2bddb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  manualButtonText: {
    color: '#0e1230',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0e1230',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIntroText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f2e8d5',
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0e1230',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  introText: {
    fontSize: 30,
    color: '#f2e8d5',
    fontWeight: 'bold',
  },
});
