// TYPE DEFINITION: Multimodal Support
// This is a "Union Type" that allows the content to be either:
// 1. A simple string (standard chat)
// 2. An array of objects (multimodal chat with text AND images)
// This structure mirrors the OpenAI GPT-4 Vision API format.
export type MessageContent =
  | string
  | Array<{ type: "text"; text: string } 
  | { type: "image_url"; image_url: { url: string } }>;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: MessageContent;
}

export async function sendChat(messages: ChatMessage[]) {
  const res = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  // Check for HTTP errors (e.g., 400, 500) or missing body
  if (!res.ok || !res.body) throw new Error("Network error");

  // Instead of waiting for the full JSON response (like `await res.json()`),
  // we get a reader for the raw response stream.
  //
  // This allows the calling function to process data "chunks" as they arrive,
  // creating the "typewriter effect" common in AI interfaces.
  return res.body.getReader();
}