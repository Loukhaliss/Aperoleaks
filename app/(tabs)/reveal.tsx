import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '../../Store/useUserStore';
import io from 'socket.io-client';

const socket = io("http://192.168.1.131:3000");

export default function RevealScreen() {
  const { pseudo } = useUserStore();
  const { code } = useLocalSearchParams();
  const router = useRouter();

  const [players, setPlayers] = useState([]);
  const [author, setAuthor] = useState(null);
  const [results, setResults] = useState([]);
  const [difficulty, setDifficulty] = useState(1);
  const [hasMoreMedia, setHasMoreMedia] = useState(false);

  useEffect(() => {
    if (!code) return;

    socket.emit("get_players", code);

    socket.on("players_list", (playerList) => {
      setPlayers(playerList);
    });

    socket.emit("request_reveal", code);

    socket.on("votes_revealed", (payload) => {
      setAuthor(payload.author);
      setResults(payload.results);
      setPlayers(payload.players);
      setDifficulty(payload.difficulty);
      setHasMoreMedia(payload.hasMoreMedia);
    });

    socket.on("end_game", () => {
      router.replace(`/end?code=${code}`);
    });

    return () => {
      socket.off("votes_revealed");
      socket.off("players_list");
      socket.off("end_game");
    };
  }, [code]);

  const isHost = players.length > 0 && players[0].pseudo === pseudo;

  const handleNextRound = () => {
    socket.emit("next_round", code);
    router.replace(`/round?code=${code}`);
  };

  const handleGoToEnd = () => {
    socket.emit("go_to_end", code);
  };

  const getResultText = (playerPseudo) => {
    const r = results.find((r) => r.name === playerPseudo);
    return r ? r.action : "–";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Résultats des votes</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.playersGrid}>
          {players.map((player, index) => {
            const isAuthor = player.pseudo === author?.pseudo;
            return (
              <View
                key={player.pseudo || index}
                style={[styles.playerCard, isAuthor && styles.highlight]}
              >
                {player.avatar ? (
                  <Image source={{ uri: player.avatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person-circle-outline" size={60} color="#fff" />
                )}
                <Text style={styles.pseudo}>{player.pseudo}</Text>
                <Text style={styles.resultText}>
                  {isAuthor ? "Auteur 🎭" : getResultText(player.pseudo)}
                </Text>
              </View>
            );
          })}
        </View>

        {isHost && hasMoreMedia && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNextRound}>
            <Text style={styles.nextButtonText}>Manche suivante ➡️</Text>
          </TouchableOpacity>
        )}

        {isHost && !hasMoreMedia && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={styles.endText}>Fin de la partie 🎉</Text>
            <TouchableOpacity style={styles.resultsButton} onPress={handleGoToEnd}>
              <Text style={styles.resultsButtonText}>Passer aux résultats</Text>
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
  title: {
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
    width: 100,
    alignItems: 'center',
    marginBottom: 28,
  },
  highlight: {
    borderColor: '#FF6F3C',
    borderWidth: 2,
    borderRadius: 50,
    padding: 6,
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
  resultText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#f2bddb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  nextButtonText: {
    color: '#0e1230',
    fontWeight: 'bold',
    fontSize: 16,
  },
  endText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
  },
  resultsButton: {
    marginTop: 8,
    backgroundColor: '#FF6F3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  resultsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
