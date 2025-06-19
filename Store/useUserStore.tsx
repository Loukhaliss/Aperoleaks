// C:/Users/lucas/OneDrive/Bureau/Projets/Apéroleak/Aperoleaks/Store/useUserStore.ts
import { create } from 'zustand';

type UserStore = {
  pseudo: string;
  avatar: string | null;
  setPseudo: (pseudo: string) => void;
  setAvatar: (avatar: string | null) => void;
  reset: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  pseudo: '',
  avatar: null,
  setPseudo: (pseudo) => set({ pseudo }),
  setAvatar: (avatar) => set({ avatar }),
  reset: () => set({ pseudo: '', avatar: null }),
}));
