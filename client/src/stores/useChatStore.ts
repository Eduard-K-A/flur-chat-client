import { create } from "zustand";
import { nanoid } from "nanoid";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[]; // base64 previews
};

type ChatStore = {
  messages: Message[];
  isLoading: boolean;
  addMessage: (msg: Omit<Message, "id">) => void; //does not create ID for every message
  appendToLastMessage: (text: string) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,

  // Adds a new message to the array.
  // We use the spread operator (...s.messages) to ensure we are creating 
  // a new array reference, which triggers a UI re-render.
  addMessage: (msg) => 
    set((s) => ({ 
      messages: [...s.messages, { ...msg, id: nanoid() }] 
    })),

  // LOGIC EXPLANATION: Streaming Updates
  // This function is used when receiving chunked text (e.g., from an LLM stream).
  // Instead of pushing to an array, we must map over the existing array.
  appendToLastMessage: (text) =>
    set((s) => ({
      messages: s.messages.map((m, i) =>
        // Check if this is the last message in the array
        i === s.messages.length - 1
          ? { 
              ...m, // Keep existing properties (id, role, etc.)
              content: m.content + text // Append the new chunk to the content
            } 
          : m // Return all other messages unchanged
      ),
    })),

  setLoading: (v) => set({ isLoading: v }),
  clear: () => set({ messages: [], isLoading: false }),
}));