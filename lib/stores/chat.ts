import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, OperatorProfile } from '@/types/chat';

const defaultOperator: OperatorProfile = {
  name: 'Sardor',
  role: 'Texnik mutaxassis',
  avatarInitial: 'S',
  isOnline: true,
  responseTimeText: "Odatda 5 daqiqada javob beradi",
};

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  author: 'operator',
  text: "Salom! 👋 Men Sardor, DEFT MOTO servis chatining mutaxassisi. Sizga qanday yordam bera olaman? Mototsiklingiz rasmini yuboring yoki muammoni yozing.",
  createdAt: new Date().toISOString(),
  operatorName: defaultOperator.name,
  operatorRole: defaultOperator.role,
};

function makeSessionId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  isOperatorTyping: boolean;
  operator: OperatorProfile;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setOperatorTyping: (typing: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessionId: makeSessionId(),
      messages: [welcomeMessage],
      isOperatorTyping: false,
      operator: defaultOperator,
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      updateMessage: (id, patch) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      setOperatorTyping: (typing) => set({ isOperatorTyping: typing }),
      reset: () => set((state) => ({ ...state, messages: [welcomeMessage], isOperatorTyping: false })),
    }),
    {
      name: 'deftmoto-chat',
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages,
        operator: state.operator,
      }),
    },
  ),
);
