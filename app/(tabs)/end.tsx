import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../../Store/useUserStore';
import io from 'socket.io-client';

const socket = io('http://192.168.1.131:3000');

const REWARDS = [
  {
    label: "L'ivrogne de service est (joueur qui a bu le plus de gorgées) :",
    statKey: 'drinksTaken',
    gages: [
      "Pas de pitié ici. Bois en 1 de plus ☠️",
      "Distribue 3 gorgées à une seule personne. La vengeance est un plat qui se mange froid 🧛",
      "Autant s'enquiller jusqu'au bout : bois entre 1 et 3 gorgées et choisis une personne qui devra boire le double 🤮",
    ],
  },
  {
    label: "Le sniper est (joueur qui a donné le plus de bonnes réponses) :",
    statKey: 'timesCorrect',
    gages: [
      "Headshot 🎯 Donne 1 gorgée",
      "Headshot 🎯 Donne 2 gorgées",
      "Headshot 🎯 Donne 3 gorgées",
    ],
  },
  {
    label: "Le grillé est (le joueur qui s'est fait le plus cramer) :",
    statKey: 'timesTargeted',
    gages: [
      "Bois 2 gorgées pour être aussi guez…",
      "Lot de consolation : tu peux distribuer 1 gorgée",
    ],
  },
  {
    label: "Le stratège est (le joueur qui s'est fait le moins cramer) :",
    statKey: 'timesTargeted',
    reverse: true,
    gages: [
      "Bien joué soldat, tu peux distribuer 3 gorgées 🪖",
      "Pas mal. Voici une protection contre une distribution de gorgées (après à toi de t'en rappeler on va pas te la dessiner in-game y'a pas le budget)",
    ],
  },
  {
    label: "Le fragile est (le joueur qui a été le plus dénoncé pour avoir ri) :",
    statKey: 'timesDenounced',
    gages: [
      "Bois 1 gorgée, ça t'apprendra à être faible",
      "Fais nous 10 pompes, faut endurcir tout ça le fragile",
      "Distribue 2 gorgées à la personne la plus aigrie ici",
      "Interdiction de sourire jusqu'au début de la prochaine partie, si tu chopes quelqu'un, il doit boire 1 gorgée",
    ],
  },
  {
    label: "Le plus fourbe est",
    statKey: 'timesWrong',
    gages: [
      "Doit avouer un de ses secrets d'ivresse 😈",
      "Distribue 2 gorgées en toute discrétion",
    ],
  },
  {
    label: "Le figurant est (personne n'a voté pour lui)",
    statKey: 'timesTargeted',
    reverse: true,
    gages: [
      "Tu crois qu'on t'a pas vu ? Bois 2 gorgées pour ta transparence",
      "Tu passes à la postérité : mime la statue pendant 1 minute",
    ],
  },
];

export default function EndScreen() {
  const { code } = useLocalSearchParams();
  const { pseudo } = useUserStore();
  const router = useRouter();

  const [players, setPlayers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedGage, setSelectedGage] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showGage, setShowGage] = useState(false);

  useEffect(() => {
    socket.emit('get_end_stats', code);
    socket.on('end_stats', (data) => {
      setPlayers(data);
    });
    return () => {
      socket.off('end_stats');
    };
  }, [code]);

  useEffect(() => {
    if (players.length === 0) return;

    const reward = REWARDS[currentIndex];
    const sorted = [...players].sort((a, b) => {
      const aVal = a[reward.statKey] || 0;
      const bVal = b[reward.statKey] || 0;
      return reward.reverse ? aVal - bVal : bVal - aVal;
    });

    const top = sorted[0];
    const value = top?.[reward.statKey] || 0;

    if (!top || value === 0) {
      setSelectedPlayer(null);
      setSelectedGage("Personne n'a brillé ici ☹️");
      setShowProfile(true);
      setShowGage(true);
    } else {
      setTimeout(() => {
        setSelectedPlayer(top);
        setShowProfile(true);
      }, 1000);
      setTimeout(() => {
        const g = reward.gages[Math.floor(Math.random() * reward.gages.length)];
        setSelectedGage(g);
        setShowGage(true);
      }, 2000);
    }
  }, [players, currentIndex]);

  const handleNext = () => {
    if (currentIndex + 1 < REWARDS.length) {
      setShowProfile(false);
      setShowGage(false);
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/');
    }
  };

  const reward = REWARDS[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fin de partie 🎉</Text>
      <Text style={styles.subtitle}>{reward.label}</Text>

      {showProfile && selectedPlayer && (
        <View style={styles.playerCard}>
          {selectedPlayer.avatar ? (
            <Image source={{ uri: selectedPlayer.avatar }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={60} color="#fff" />
          )}
          <Text style={styles.pseudo}>{selectedPlayer.pseudo}</Text>
        </View>
      )}

      {showGage && (
        <Text style={styles.gage}>{selectedGage}</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e1230', padding: 24, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 30, color: '#f5f5dc', fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 20, color: '#fff', marginBottom: 20, textAlign: 'center' },
  playerCard: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  pseudo: { color: '#fff', fontSize: 18, marginTop: 8 },
  gage: { color: '#f2bddb', fontSize: 16, textAlign: 'center', marginTop: 12 },
  button: { marginTop: 30, backgroundColor: '#f2bddb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  buttonText: { color: '#0e1230', fontWeight: 'bold' },
});
