import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from 'C:/Users/lucas/OneDrive/Bureau/Projets/Apéroleak/Aperoleaks/Store/useUserStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import io from 'socket.io-client';

const socket = io("http://192.168.1.131:3000");

export default function GameScreen() {
  const { pseudo } = useUserStore();
  const [mediaList, setMediaList] = useState([]);
  const [selectedUri, setSelectedUri] = useState(null);
  const [showDifficultyPanel, setShowDifficultyPanel] = useState(false);
  const router = useRouter();
  const { code } = useLocalSearchParams();
  const roomCode = code?.toString();

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedUri(result.assets[0].uri);
      setShowDifficultyPanel(true);
    }
  };

  const handleAddMedia = (difficulty) => {
    if (!selectedUri || !roomCode) return;

    const media = {
      uri: selectedUri,
      type: 'image', // à améliorer pour différencier les vidéos
      difficulty,
      author: pseudo,
    };

    socket.emit("add_media", {
      code: roomCode,
      media,
    });

    setMediaList((prev) => [...prev, media]);
    setSelectedUri(null);
    setShowDifficultyPanel(false);
  };

  const handleStart = () => {
    if (!roomCode || mediaList.length === 0) return;

    socket.emit("start_game", roomCode);
    router.replace(`/round?code=${roomCode}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}> 🥊 Salle de préparation 🥊</Text>
      <Text style={styles.subtitle}>Ajoute 1 à 3 médias dans la boîte pour exterminer tes potes</Text>

      {/* BOÎTE MAGIQUE */}
      <Pressable onPress={handlePickMedia} style={styles.boxArea}>
        <Image source={require('C:/Users/lucas/OneDrive/Bureau/Projets/Apéroleak/Aperoleaks/app/assests/magic-box.png')} style={styles.boxImage} />
        <Text style={styles.boxText}>Ajouter un post</Text>
      </Pressable>

      {/* PANEL DE DIFFICULTÉ */}
      {showDifficultyPanel && (
        <View style={styles.difficultyPanel}>
          <Text style={styles.difficultyTitle}>Choisis la difficulté 🎯</Text>
          {[1, 2, 3].map((level) => (
            <Pressable
              key={level}
              style={styles.diffButton}
              onPress={() => handleAddMedia(level)}
            >
              <Text style={styles.diffButtonText}>
                {level} {level === 1 ? 'gorgée' : 'gorgées'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* LISTE DES MÉDIAS AJOUTÉS */}
      <Text style={styles.counter}>Tu as ajouté {mediaList.length} / 3 médias</Text>
      <ScrollView horizontal>
        {mediaList.map((m, i) => (
          <Image
            key={i}
            source={{ uri: m.uri }}
            style={{ width: 80, height: 80, margin: 6, borderRadius: 8 }}
          />
        ))}
      </ScrollView>

      {mediaList.length >= 1 && (
        <Pressable style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startText}>Entrer dans l’arène ⚔️</Text>
        </Pressable>
      )}
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f2bddb',
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 40,
    textAlign: 'center',
  },
  boxArea: {
    alignItems: 'center',
    marginBottom: 0,
  },
  boxImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  boxText: {
    color: '#f2bddb',
    fontSize: 18,
    marginTop: 8,
  },
  difficultyPanel: {
    marginTop: 16,
    backgroundColor: '#1a1f40',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  difficultyTitle: {
    color: '#ffffff',
    marginBottom: 8,
    fontSize: 16,
  },
  diffButton: {
    backgroundColor: '#f2bddb',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 4,
  },
  diffButtonText: {
    color: '#0e1230',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counter: {
    color: '#fff',
    marginTop: 50,
    marginBottom: 8,
    fontSize: 14,
  },
  startButton: {
    marginTop: 0,
    marginBottom: 50,
    backgroundColor: '#f2bddb',
    paddingVertical: 14,
    borderRadius: 14,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  startText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0e1230',
  },
});
