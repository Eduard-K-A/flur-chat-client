import { useState } from "react";
import { Send, Paperclip, X, Image, Sparkles } from "lucide-react";
import { useChatStore } from "../stores/useChatStore";
import { sendChat } from "../lib/api";

type ImageObject = { type: "image_url"; image_url: { url: string } };
type TextObject = { type: "text"; text: string };
type UserContent = ImageObject | TextObject;
type PayloadMessage = { role: "system" | "user" | "assistant"; content: string | UserContent[] };

export default function ChatInput() {
  // Text input, uploaded image list, system editor toggle, textarea focus state
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showSystemEditor, setShowSystemEditor] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Zustand state management functions
  const {
    addMessage,
    appendToLastMessage,
    setLoading,
    isLoading,
    systemPrompt,
    setSystemPrompt
  } = useChatStore();

  // Converts an uploaded file to a Base64 string for preview + sending
  const processImage = (file: File) => {
    const reader = new FileReader();

    // When file is converted → append result to images[]
    reader.onload = () =>
      setImages((prev) => [...prev, reader.result as string]);

    reader.readAsDataURL(file);
  };

  const send = async () => {
    // Prevent sending empty messages
    if (!text.trim() && images.length === 0) return;

    // Build user message content:
    // - If text exists, add text object
    // - For each image, push an image_url object
    const userContent: UserContent[] = text.trim() ? [{ type: "text", text }] : [];
    images.forEach((img) =>
      userContent.push({
        type: "image_url",
        image_url: { url: img }
      })
    );

    // Add user message to UI history
    addMessage({ role: "user", content: text, images });

    // Clear inputs
    setText("");
    setImages([]);

    // Prepare placeholder assistant message that will be streamed into
    setLoading(true);
    addMessage({ role: "assistant", content: "" });

    // -------------------------
    // BUILDING THE FINAL PAYLOAD
    // -------------------------
    // Zustand messages includes the new empty assistant message at the end,
    // so slice(0, -1) removes that placeholder before sending.
    const currentMessages = useChatStore.getState().messages.slice(0, -1);

    const payloadMessages: PayloadMessage[] = [];

    // Insert system prompt ONLY at the top if it exists
    // and if it is not already the first message.
    if (systemPrompt && String(systemPrompt).trim()) {
      const firstIsSystem = currentMessages[0]?.role === "system";
      if (!firstIsSystem) {
        payloadMessages.push({
          role: "system",
          content: systemPrompt
        });
      }
    }

    // Add full chat history
    payloadMessages.push(...currentMessages);

    // Add latest message as either:
    //   - pure text
    //   - structured array containing text + images
    payloadMessages.push({
      role: "user",
      content: userContent.length === 1 ? text : userContent
    });

    // -------------------------
    // STREAMING RESPONSE HANDLING
    // -------------------------
    const reader = await sendChat(payloadMessages);
    const decoder = new TextDecoder();

    while (true) {
      // Read server-sent-event (SSE) stream chunks
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);

      // SSE sends lines like "data: {json}"
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const json = line.slice(6);

          // Stop when server indicates the end of stream
          if (json === "[DONE]") continue;

          try {
            const parsed = JSON.parse(json);

            // Extract token from streaming SSE delta structure
            const token = parsed.choices[0]?.delta?.content || "";

            // Append token live to the last assistant message
            if (token) appendToLastMessage(token);
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    }

    setLoading(false);
  };

  // Conditions for enabling the send button
  const canSend = (text.trim() || images.length > 0) && !isLoading;

  return (
    <>
      <div className="p-4 bg-linear-to-t from-slate-50 to-transparent">
        <div
          className={`
            relative mx-auto max-w-3xl rounded-2xl
            bg-white shadow-lg shadow-slate-200/50
            border transition-all duration-300
            ${isFocused ? "border-violet-400 ring-4 ring-violet-100" : "border-slate-200"}
          `}
        >
          {/* IMAGE PREVIEW STRIP */}
          {images.length > 0 && (
            <div className="p-3 border-b border-slate-100">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative group shrink-0 rounded-xl overflow-hidden"
                  >
                    <img src={img} className="h-20 w-20 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Remove image */}
                    <button
                      onClick={() =>
                        setImages((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white 
                                 opacity-0 group-hover:opacity-100 transition-all
                                 hover:bg-red-500 hover:scale-110"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Image Upload Button */}
                <label
                  className="shrink-0 h-20 w-20 rounded-xl border-2 border-dashed 
                             border-slate-200 hover:border-violet-300 hover:bg-violet-50
                             flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Image className="w-6 h-6 text-slate-400" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      e.target.files &&
                      Array.from(e.target.files).forEach(processImage)
                    }
                  />
                </label>
              </div>
            </div>
          )}

          {/* INPUT AREA */}
          <div className="flex items-end gap-2 p-2">
            {/* Attach images */}
            <label className="p-2.5 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 cursor-pointer transition-colors">
              <Paperclip className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) =>
                  e.target.files &&
                  Array.from(e.target.files).forEach(processImage)
                }
              />
            </label>

            {/* System prompt toggle */}
            <button
              type="button"
              onClick={() => setShowSystemEditor((v) => !v)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 cursor-pointer transition-colors"
              title="Edit system prompt"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* MAIN TEXTAREA */}
            <textarea
              className="flex-1 resize-none bg-transparent text-slate-700 
                         placeholder:text-slate-400 focus:outline-none
                         text-sm leading-relaxed py-2.5 px-1
                         min-h-11 max-h-[200px]"
              placeholder="Message AI assistant..."
              rows={1}
              value={text}
              onChange={(e) => {
                setText(e.target.value);

                // Auto-resize height up to max 200px
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                // Enter = send, Shift+Enter = new line
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            {/* SEND BUTTON */}
            <button
              onClick={send}
              disabled={!canSend}
              className={`
                p-2.5 rounded-xl transition-all duration-200
                ${canSend
                  ? "bg-linear-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300 hover:scale-105 active:scale-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }
              `}
            >
              {isLoading ? (
                <Sparkles className="w-5 h-5 animate-pulse" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* SYSTEM PROMPT EDITOR */}
          {showSystemEditor && (
            <div className="p-3 border-b border-slate-100 bg-white">
              <textarea
                className="w-full rounded-md border border-slate-200 p-2 text-sm resize-none"
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="System prompt: instruct the assistant (hidden from chat history)"
              />
            </div>
          )}

          <div className="px-4 pb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {images.length > 0 && (
              <span className="text-violet-500">{images.length} image(s) attached</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
