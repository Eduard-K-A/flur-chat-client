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
  addMessage: (msg: Omit<Message, "id">) => void;
  appendToLastMessage: (text: string) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, { ...msg, id: nanoid() }] })),
  appendToLastMessage: (text) =>
    set((s) => ({
      messages: s.messages.map((m, i) =>
        i === s.messages.length - 1 ? { ...m, content: m.content + text } : m
      ),
    })),
  setLoading: (v) => set({ isLoading: v }),
  clear: () => set({ messages: [], isLoading: false }),
}));