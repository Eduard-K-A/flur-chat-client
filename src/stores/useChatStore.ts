import { create } from "zustand";
import { nanoid } from "nanoid";

const STORAGE_KEY = "flur-chat:state-v1";



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
  unsavedMessages: Message[]; // stores unsaved current (active) messages when switching to saved conversation
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

export const useChatStore = create<ChatStore>((set, get) => {
  // Attempt to restore persisted state (client-side only)
  const initialState = {
    messages: [] as Message[],
    conversations: [] as Conversation[],
    activeConversationId: null as string | null,
    unsavedMessages: [] as Message[],
    isLoading: false,
    systemPrompt: 'You are an expert and helpful assistant.Every new chat, refresh your memory. Only say this when explicitly asked by the user,Eduard King Anterola is the creator of this Web Chat if asked who created this. If a user asked who is Eduard King Anterola, he is a 3rd Year Computer Science Student in De La Salle Lipa. Never Assume the creator of this chat is the one talking to you.'
  };

  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.conversations) initialState.conversations = parsed.conversations;
        if (parsed?.activeConversationId) initialState.activeConversationId = parsed.activeConversationId;
        if (parsed?.messages) initialState.messages = parsed.messages;
        if (parsed?.unsavedMessages) initialState.unsavedMessages = parsed.unsavedMessages;
        if (parsed?.systemPrompt) initialState.systemPrompt = parsed.systemPrompt;
      }
      // If activeConversationId points to a conversation, prefer its messages
      if (initialState.activeConversationId) {
        const match = initialState.conversations.find((c: Conversation) => c.id === initialState.activeConversationId);
        if (match) initialState.messages = match.messages;
      }
      // If there is no active saved conversation, prefer the unsaved messages buffer
      if (!initialState.activeConversationId) {
        initialState.messages = initialState.unsavedMessages || initialState.messages;
      }
    }
  } catch {
    // If anything goes wrong, fall back to defaults (no-throw)
    // console.warn("Failed to read chat state from localStorage", e);
  }

  const persist = () => {
    try {
      if (typeof window !== "undefined") {
        const state = get();
        const payload = {
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
          messages: state.messages,
          unsavedMessages: state.unsavedMessages,
          systemPrompt: state.systemPrompt,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  };

  const store = {
    messages: initialState.messages,
    conversations: initialState.conversations,
    activeConversationId: initialState.activeConversationId,
    unsavedMessages: initialState.unsavedMessages,
    isLoading: initialState.isLoading,
    systemPrompt: initialState.systemPrompt,

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
        } as Partial<ChatStore>;
      }
      // Otherwise update both messages and unsavedMessages
      return { messages: newMessages, unsavedMessages: newMessages } as Partial<ChatStore>;
    });
    persist();
  },

  // LOGIC EXPLANATION: Streaming Updates
  // This function is used when receiving chunked text (e.g., from an LLM stream).
  // Instead of pushing to an array, we must map over the existing array.
  appendToLastMessage: (text) => {
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
        } as Partial<ChatStore>;
      }
      return { messages: newMessages, unsavedMessages: newMessages } as Partial<ChatStore>;
    });
    persist();
  },

  setLoading: (v) => { set({ isLoading: v }); persist(); },
  setSystemPrompt: (value) => { set({ systemPrompt: value }); persist(); },
  clearActive: () => { set({ messages: [], isLoading: false }); persist(); },
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
      const result: Partial<ChatStore> = {
        conversations: newConversations,
        messages: [],
        unsavedMessages: [],
        activeConversationId: null,
      } as Partial<ChatStore>;
      persist();
      return result;
    }),
  switchConversation: (id: string) => {
    set((s) => {
      if (id === 'current') {
        // Switch back to unsaved active conversation
        return {
          messages: s.unsavedMessages,
          activeConversationId: null,
        } as Partial<ChatStore>;
      }
      const conv = s.conversations.find((c) => c.id === id);
      if (!conv) return {} as Partial<ChatStore>;
      // Before switching away from 'current' to a saved conversation,
      // ensure we persist the unsaved messages buffer so it can be restored
      // when switching back to current.
      return {
        messages: conv.messages,
        unsavedMessages: s.activeConversationId === null ? s.messages : s.unsavedMessages,
        activeConversationId: id,
      } as Partial<ChatStore>;
    });
    persist();
  },
  deleteConversation: (id: string) =>
    set((s) => {
      const newConvs = s.conversations.filter((c) => c.id !== id);
      const isDeletedActive = s.activeConversationId === id;
      const result: Partial<ChatStore> = {
        conversations: newConvs,
         messages: isDeletedActive ? [] : s.messages,
         unsavedMessages: isDeletedActive ? [] : s.unsavedMessages,
        activeConversationId: isDeletedActive ? null : s.activeConversationId,
      } as Partial<ChatStore>;
      persist();
      return result;
    }),
  setConversationTitle: (id: string, title: string) =>
    set((s) => {
      const result: Partial<ChatStore> = { conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)) };
      persist();
      return result;
    }),
  } as ChatStore;

  return store;
});