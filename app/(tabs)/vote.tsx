import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '../../Store/useUserStore';
import io from 'socket.io-client';

const socket = io('http://192.168.1.131:3000'); // Assure-toi que c'est bien ton IP locale

export default function VoteScreen() {
  const { pseudo } = useUserStore();
  const { code } = useLocalSearchParams();
  const router = useRouter();

  const [players, setPlayers] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    socket.emit('get_players', code);
    socket.on('players_list', (data) => {
      setPlayers(data); // Inclut le joueur lui-même maintenant
    });

    socket.on('vote_confirmed', ({ target }) => {
      setHasVoted(true);
      setVotedFor(target);
    });

    // Gestion de la révélation (si tu veux faire quelque chose à la réception)
    socket.on('votes_revealed', (results) => {
      Alert.alert('Votes révélés', JSON.stringify(results));
    });

    return () => {
      socket.off('players_list');
      socket.off('vote_confirmed');
      socket.off('votes_revealed');
    };
  }, [code]);

  const handleVote = (target: string) => {
    if (hasVoted) {
      Alert.alert('Vote déjà effectué', `Tu as déjà voté pour ${votedFor}`);
      return;
    }
    socket.emit('vote', { code, from: pseudo, target });
  };

  const handleReveal = () => {
    socket.emit('reveal_votes', code);
    // Redirection vers reveal.tsx avec le paramètre code
    router.push({
      pathname: '/reveal',
      params: { code },
    });
  };

  // L'hôte est considéré comme le premier joueur dans la liste players
  const isHost = players.length > 0 && players[0].pseudo === pseudo;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phase de vote</Text>

      <ScrollView contentContainerStyle={styles.playersContainer}>
        {players.map((player, index) => (
          <View key={index} style={styles.card}>
            {player.avatar ? (
              <Image source={{ uri: player.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholder]}>
                <Text style={styles.placeholderText}>👤</Text>
              </View>
            )}
            <Text style={styles.pseudo}>{player.pseudo}</Text>
            <TouchableOpacity
              onPress={() => handleVote(player.pseudo)}
              disabled={hasVoted}
              style={[
                styles.voteButton,
                hasVoted && styles.voteButtonDisabled,
              ]}
            >
              <Text style={styles.voteButtonText}>
                {hasVoted && votedFor === player.pseudo ? '✅ Voté' : 'Voter'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {isHost && (
        <TouchableOpacity style={styles.revealButton} onPress={handleReveal}>
          <Text style={styles.revealButtonText}>Révéler</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e1230',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    color: '#f2e8d5',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  playersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#1c2541',
    borderRadius: 12,
    alignItems: 'center',
    padding: 16,
    margin: 8,
    width: 140,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  placeholder: {
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 30,
  },
  pseudo: {
    color: '#f2e8d5',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  voteButton: {
    backgroundColor: '#f2bddb',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  voteButtonDisabled: {
    backgroundColor: '#aaa',
  },
  voteButtonText: {
    color: '#0e1230',
    fontWeight: 'bold',
  },
  revealButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#FF6F3C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
  },
  revealButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
