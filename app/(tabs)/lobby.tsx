import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import io from 'socket.io-client';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from 'C:/Users/lucas/OneDrive/Bureau/Projets/Apéroleak/Aperoleaks/Store/useUserStore';

const socket = io("http://192.168.1.131:3000");

export default function LobbyScreen() {
  const { code } = useLocalSearchParams();
  const roomCode = code?.toString() || '';
  const { pseudo, avatar } = useUserStore();
  const [players, setPlayers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (pseudo && roomCode) {
      socket.emit("join_room", {
        code: roomCode,
        pseudo,
        avatar,
      });

      socket.on("room_update", (updatedPlayers) => {
        setPlayers(updatedPlayers);
      });

      socket.on("game_started", () => {
        router.replace({
          pathname: '/game',
          params: { code: roomCode },
        });
      });

      return () => {
        socket.off("room_update");
        socket.off("game_started");
      };
    }
  }, [pseudo, roomCode, avatar]);

  const handleStartGame = () => {
    socket.emit("start_game", roomCode);
    router.replace({
      pathname: '/game',
      params: { code: roomCode },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.roomCode}># {roomCode}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.playersGrid}>
          {players.map((player, index) => (
            <View
              key={player.id || index}
              style={[styles.playerCard, index === 0 && styles.hostBorder]}
            >
              {player.avatar ? (
                <Image source={{ uri: player.avatar }} style={styles.avatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={60} color="#fff" />
              )}
              <Text style={styles.pseudo}>{player.pseudo}</Text>
              {index === 0 && <Text style={styles.hostTag}>Hôte</Text>}
            </View>
          ))}
        </View>

        {players.length > 0 && players[0].pseudo === pseudo && (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <Text style={styles.startText}>Lancer la partie 🚀</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e1230',
    padding: 24,
    paddingTop: 60,
  },
  roomCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f5f5dc',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    alignItems: 'center',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  playerCard: {
    width: 72,
    alignItems: 'center',
    marginBottom: 28,
  },
  hostBorder: {
    borderWidth: 2,
    borderColor: '#FF6F3C',
    borderRadius: 50,
    padding: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  pseudo: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  hostTag: {
    marginTop: 2,
    fontSize: 10,
    color: '#FF6F3C',
    fontWeight: 'bold',
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  startButton: {
    backgroundColor: '#f2bddb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e1230',
  },
});
