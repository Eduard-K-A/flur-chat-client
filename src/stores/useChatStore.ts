import { create } from "zustand";
import { nanoid } from "nanoid";



type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // base64 previews
};

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

type ChatStore = {
  messages: Message[]; // active conversation messages
  conversations: Conversation[]; // saved conversations
  activeConversationId: string | null; // null when using unsaved active messages
  isLoading: boolean;
  systemPrompt: string;
  addMessage: (msg: Omit<Message, "id">) => void; //does not create ID for every message
  appendToLastMessage: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setSystemPrompt: (value: string) => void;
  clearActive: () => void;
  newConversation: (title?: string) => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  setConversationTitle: (id: string, title: string) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  systemPrompt: 'You are an expert and helpful assistant.Every new chat, refresh your memory. Only say this when explicitly asked by the user,Eduard King Anterola is the creator of this Web Chat if asked who created this. If a user asked who is Eduard King Anterola, he is a 3rd Year Computer Science Student in De La Salle Lipa. Never Assume the creator of this chat is the one talking to you.',

  // Adds a new message to the array.
  // We use the spread operator (...s.messages) to ensure we are creating 
  // a new array reference, which triggers a UI re-render.
  addMessage: (msg) => {
    set((s) => {
      const newMessages = [...s.messages, { ...msg, id: nanoid() }];
      // If we're viewing a saved conversation (activeConversationId), update it there too
      if (s.activeConversationId) {
        return {
          messages: newMessages,
          conversations: s.conversations.map((c) =>
            c.id === s.activeConversationId ? { ...c, messages: newMessages } : c
          ),
        } as any;
      }
      return { messages: newMessages } as any;
    });
  },

  // LOGIC EXPLANATION: Streaming Updates
  // This function is used when receiving chunked text (e.g., from an LLM stream).
  // Instead of pushing to an array, we must map over the existing array.
  appendToLastMessage: (text) =>
    set((s) => {
      const newMessages = s.messages.map((m, i) =>
        i === s.messages.length - 1 ? { ...m, content: m.content + text } : m
      );
      if (s.activeConversationId) {
        return {
          messages: newMessages,
          conversations: s.conversations.map((c) =>
            c.id === s.activeConversationId ? { ...c, messages: newMessages } : c
          ),
        } as any;
      }
      return { messages: newMessages } as any;
    }),

  setLoading: (v) => set({ isLoading: v }),
  setSystemPrompt: (value) => set({ systemPrompt: value }),
  clearActive: () => set({ messages: [], isLoading: false }),
  newConversation: (title?: string) =>
    set((s) => {
      // Save current conversation if it has messages
      let newConversations = s.conversations;
      if (s.messages.length > 0) {
        const convTitle = title ||
          (s.messages[0]?.content || 'Conversation').slice(0, 50);
        newConversations = [
          ...s.conversations,
          {
            id: nanoid(),
            title: convTitle,
            createdAt: new Date().toISOString(),
            messages: s.messages,
          },
        ];
      }
      return {
        conversations: newConversations,
        messages: [],
        activeConversationId: null,
      } as any;
    }),
  switchConversation: (id: string) =>
    set((s) => {
      if (id === 'current') {
        // Switch back to unsaved active conversation
        return {
          messages: s.messages,
          activeConversationId: null,
        } as any;
      }
      const conv = s.conversations.find((c) => c.id === id);
      if (!conv) return {} as any;
      return {
        messages: conv.messages,
        activeConversationId: id,
      } as any;
    }),
  deleteConversation: (id: string) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      // If deleting currently active saved conversation, reset active
      messages: s.activeConversationId === id ? [] : s.messages,
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    } as any)),
  setConversationTitle: (id: string, title: string) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
    } as any)),
}));