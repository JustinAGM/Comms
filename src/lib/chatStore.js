import { create } from 'zustand';
import { useUserStore } from './UserStore';
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const useChatStore = create((set, get) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    if (user.blocked.includes(currentUser.id)) {
      return set({
        chatId,
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    } else if (currentUser.blocked.includes(user.id)) {
      return set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    } else {
      return set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  changeBlock: async () => {
    const { user } = get();
    const currentUser = useUserStore.getState().currentUser;

    if (!user || !currentUser) return;

    try {
      const currentUserDoc = await getDoc(doc(db, "users", currentUser.id));
      const otherUserDoc = await getDoc(doc(db, "users", user.id));

      const currentUserData = currentUserDoc.data();
      const otherUserData = otherUserDoc.data();

      const isReceiverBlocked = currentUserData.blocked?.includes(user.id);
      const isCurrentUserBlocked = otherUserData.blocked?.includes(currentUser.id);

      set({
        isReceiverBlocked,
        isCurrentUserBlocked,
      });
    } catch (err) {
      console.error("Failed to update block state:", err);
    }
  },

  resetChat: () => {
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));
