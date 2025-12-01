import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";

const STORAGE_KEY = "flur-chat:state-v1";

// Multimodal content types matching OpenAI/Groq format
export type MessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: MessageContent; // Can be string OR array
  images?: string[]; // For UI preview only
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

type ChatState = {
  messages: Message[];
  conversations: Conversation[];
  activeConversationId: string | null;
  unsavedMessages: Message[];
  isLoading: boolean;
  systemPrompt: string;
};

type ChatActions = {
  addMessage: (msg: Omit<Message, "id">) => void;
  appendToLastMessage: (text: string) => void;
  setLoading: (loading: boolean) => void;
  setSystemPrompt: (value: string) => void;
  clearActive: () => void;
  newConversation: (title?: string) => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  setConversationTitle: (id: string, title: string) => void;
  // Helper to get messages formatted for API (includes system prompt)
  getMessagesForAPI: () => Array<{ role: string; content: MessageContent }>;
};

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      conversations: [],
      activeConversationId: null,
      unsavedMessages: [],
      isLoading: false,
      systemPrompt: 'You are an expert and helpful assistant. Eduard King Anterola is the creator of this Web Chat. If asked about Eduard King Anterola, he is a 3rd Year Computer Science Student in De La Salle Lipa.',

      // Actions
      addMessage: (msg) => {
        set((state) => {
          const newMessage = { ...msg, id: nanoid() };
          const newMessages = [...state.messages, newMessage];
          
          // If viewing a saved conversation, update it
          if (state.activeConversationId) {
            return {
              messages: newMessages,
              conversations: state.conversations.map((c) =>
                c.id === state.activeConversationId 
                  ? { ...c, messages: newMessages } 
                  : c
              ),
            };
          }
          
          // Otherwise update both messages and unsavedMessages
          return { 
            messages: newMessages, 
            unsavedMessages: newMessages 
          };
        });
      },

      appendToLastMessage: (text) => {
        set((state) => {
          if (state.messages.length === 0) return state;
          
          const newMessages = state.messages.map((m, i) => {
            if (i !== state.messages.length - 1) return m;
            
            // If content is a string, append directly
            if (typeof m.content === 'string') {
              return { ...m, content: m.content + text };
            }
            
            // If content is an array, append to the last text block
            const contentArray = [...m.content];
            const lastItem = contentArray[contentArray.length - 1];
            
            if (lastItem?.type === 'text') {
              contentArray[contentArray.length - 1] = {
                ...lastItem,
                text: lastItem.text + text
              };
            } else {
              // If last item isn't text, add a new text block
              contentArray.push({ type: 'text', text });
            }
            
            return { ...m, content: contentArray };
          });
          
          if (state.activeConversationId) {
            return {
              messages: newMessages,
              conversations: state.conversations.map((c) =>
                c.id === state.activeConversationId 
                  ? { ...c, messages: newMessages } 
                  : c
              ),
            };
          }
          
          return { 
            messages: newMessages, 
            unsavedMessages: newMessages 
          };
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),

      clearActive: () => set({ 
        messages: [], 
        unsavedMessages: [], 
        isLoading: false 
      }),

      newConversation: (title) => {
        set((state) => {
          let newConversations = state.conversations;
          
          // Save current conversation if it has messages
          if (state.messages.length > 0) {
            // Get title from first user message
            const firstMsg = state.messages.find(m => m.role === 'user');
            let defaultTitle = 'Conversation';
            
            if (firstMsg) {
              if (typeof firstMsg.content === 'string') {
                defaultTitle = firstMsg.content.slice(0, 50);
              } else {
                const textPart = firstMsg.content.find(c => c.type === 'text');
                if (textPart && 'text' in textPart) {
                  defaultTitle = textPart.text.slice(0, 50);
                }
              }
            }
            
            const convTitle = title || defaultTitle;
            
            newConversations = [
              ...state.conversations,
              {
                id: nanoid(),
                title: convTitle,
                createdAt: new Date().toISOString(),
                messages: state.messages,
              },
            ];
          }
          
          return {
            conversations: newConversations,
            messages: [],
            unsavedMessages: [],
            activeConversationId: null,
          };
        });
      },

      switchConversation: (id) => {
        set((state) => {
          if (id === 'current') {
            return {
              messages: state.unsavedMessages,
              activeConversationId: null,
            };
          }
          
          const conv = state.conversations.find((c) => c.id === id);
          if (!conv) return state;
          
          return {
            messages: conv.messages,
            unsavedMessages: state.activeConversationId === null 
              ? state.messages 
              : state.unsavedMessages,
            activeConversationId: id,
          };
        });
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConvs = state.conversations.filter((c) => c.id !== id);
          const isDeletedActive = state.activeConversationId === id;
          
          return {
            conversations: newConvs,
            messages: isDeletedActive ? [] : state.messages,
            unsavedMessages: isDeletedActive ? [] : state.unsavedMessages,
            activeConversationId: isDeletedActive ? null : state.activeConversationId,
          };
        });
      },

      setConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }));
      },

      // Helper function to prepare messages for API with system prompt
      getMessagesForAPI: () => {
        const state = get();
        return [
          {
            role: "system",
            content: state.systemPrompt,
          },
          ...state.messages
            .filter(msg => msg.role !== 'system') // Don't duplicate system messages
            .map((msg) => ({
              role: msg.role,
              content: msg.content, // Can be string OR array - both valid!
            })),
        ];
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messages: state.messages,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        unsavedMessages: state.unsavedMessages,
        systemPrompt: state.systemPrompt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        if (state.activeConversationId) {
          const match = state.conversations.find(
            (c) => c.id === state.activeConversationId
          );
          if (match) {
            state.messages = match.messages;
          }
        } else {
          state.messages = state.unsavedMessages || state.messages;
        }
      },
    }
  )
);