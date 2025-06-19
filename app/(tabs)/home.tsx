import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useUserStore } from 'C:/Users/lucas/OneDrive/Bureau/Projets/Apéroleak/Aperoleaks/Store/useUserStore';

export default function HomeScreen() {
  const [pseudo, setPseudo] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const router = useRouter();

  const { setPseudo: storeSetPseudo, setAvatar: storeSetAvatar } = useUserStore();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      storeSetAvatar(uri);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.settingsIcon}>
        <Ionicons name="settings" size={28} color="#ffffff" />
      </Pressable>

      <View style={styles.titleWrapper}>
        <Text style={styles.title}>Apéroleaks 🍹</Text>
      </View>

      <Pressable onPress={pickImage} style={styles.avatarWrapper}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={72} color="#ffffff" />
        )}
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder="Ton pseudo"
        placeholderTextColor="#ffffff"
        value={pseudo}
        onChangeText={(text) => {
          setPseudo(text);
          storeSetPseudo(text);
        }}
      />

      <Pressable
        onPress={() => {
          const newCode = generateCode();
          router.push({ pathname: '/lobby', params: { code: newCode } });
        }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Créer une partie 🎉</Text>
      </Pressable>

      <Text style={styles.orText}>— ou —</Text>

      <TextInput
        style={[styles.input, { marginBottom: 12 }]}
        placeholder="Code de la partie"
        placeholderTextColor="#ffffff"
        value={joinCode}
        onChangeText={setJoinCode}
        autoCapitalize="characters"
      />

      <Pressable
        onPress={() => {
          if (joinCode.trim()) {
            router.push({ pathname: '/lobby', params: { code: joinCode.trim().toUpperCase() } });
          }
        }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Rejoindre 🚀</Text>
      </Pressable>

      <View style={styles.decorations}>
        <Text style={styles.emoji}>🎊 🍻 🥂 🍹 🎊</Text>
      </View>

      <Text style={styles.footer}>v0.1 • Apéroleaks™</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e1230',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
    paddingTop: 80,
  },
  settingsIcon: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
  },
  titleWrapper: {
    borderWidth: 2,
    borderColor: '#FF6F3C',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#FF6F3C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    marginTop: 50,
    marginBottom: 50,
    backgroundColor: '#1a1f40',
    width: '100%',
  },
  title: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  avatarWrapper: {
    marginBottom: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: 'transparent',
    borderColor: '#FF6F3C',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#f2bddb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonPressed: {
    shadowOffset: { width: 0, height: 1 },
    transform: [{ scale: 0.96 }],
  },
  buttonText: {
    color: '#0e1230',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  orText: {
    color: '#ffffff',
    marginVertical: 12,
    fontSize: 16,
  },
  decorations: {
    position: 'absolute',
    bottom: 50,
  },
  emoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  footer: {
    color: '#ffffff',
    fontSize: 12,
    position: 'absolute',
    bottom: 16,
  },
});
