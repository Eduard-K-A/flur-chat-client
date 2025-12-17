import { useState } from "react";
import { Send, Paperclip, X, Image, Sparkles } from "lucide-react";
import { useChatStore, type MessageContent } from "../stores/useChatStore";

type ImageObject = { type: "image_url"; image_url: { url: string } };
type TextObject = { type: "text"; text: string };

export default function ChatInput() {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const {
    addMessage,
    appendToLastMessage,
    setLoading,
    isLoading,
    getMessagesForAPI,
  } = useChatStore();

  // Converts an uploaded file to a Base64 string
  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () =>
      setImages((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
  };

  // Local API helper: POST messages and return a streaming reader
  const sendChat = async (messages: Array<{ role: string; content: any }>) => {
    const base = (import.meta.env.VITE_API_BASE) || "http://localhost:3001";
    //const base = "http://localhost:3001";
    const url = `${base}/api/chat`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Chat API error: ${res.status} ${txt}`);
    }

    if (!res.body) throw new Error("Chat API response has no body to stream.");

    return res.body.getReader();
  };

  const send = async () => {
    // Prevent sending empty messages
    if (!text.trim() && images.length === 0) return;

    // Build multimodal content for API
    let messageContent: MessageContent;
    
    if (images.length === 0) {
      // Text-only message
      messageContent = text.trim();
    } else {
      // Multimodal message (text + images)
      const contentArray: Array<TextObject | ImageObject> = [];
      
      if (text.trim()) {
        contentArray.push({ type: "text", text: text.trim() });
      }
      
      images.forEach((img) => {
        contentArray.push({
          type: "image_url",
          image_url: { url: img }
        });
      });
      
      messageContent = contentArray;
    }

    // Add user message to store
    addMessage({ 
      role: "user", 
      content: messageContent,
      images: images.length > 0 ? images : undefined // For UI preview
    });

    // Clear inputs
    //const userText = text.trim();
    setText("");
    setImages([]);

    // Create placeholder for assistant response
    setLoading(true);
    //addMessage({ role: "assistant", content: "" }); -temp removed to fix double message issue

    let firstToken = true;

    try {
      // Get all messages for API (includes system prompt automatically)
      const messagesForAPI = getMessagesForAPI();
      // No assistant placeholder is added before streaming; send the current messages as-is
      const messagesToSend = messagesForAPI;

      // Send to API
      const reader = await sendChat(messagesToSend);
      const decoder = new TextDecoder();

      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        // Parse SSE stream
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const json = line.slice(6).trim();

            if (json === "[DONE]") continue;

              try {
                const parsed = JSON.parse(json);
                const token = parsed.choices?.[0]?.delta?.content || "";

                if (token) {
                  if (firstToken) {
                    addMessage({ role: "assistant", content: token });
                    firstToken = false;
                  } else {
                    appendToLastMessage(token);
                  }
                }
              } catch (err) {
                console.error("Failed to parse SSE chunk:", err);
              }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // If no token was ever received, create an assistant message with the error
      if (firstToken) {
        addMessage({ role: "assistant", content: "\n\n❌ Error: Failed to get response from server. Please try again." });
      } else {
        appendToLastMessage("\n\n❌ Error: Failed to get response from server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Enable send button if there's content and not currently loading
  const canSend = (text.trim() || images.length > 0) && !isLoading;

  return (
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
                  <img 
                    src={img} 
                    alt={`Upload ${i + 1}`}
                    className="h-20 w-20 object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Remove image button */}
                  <button
                    onClick={() =>
                      setImages((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white 
                               opacity-0 group-hover:opacity-100 transition-all
                               hover:bg-red-500 hover:scale-110"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add more images button */}
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
          {/* Attach images button */}
          <label 
            className="p-2.5 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 cursor-pointer transition-colors"
            title="Attach images"
          >
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

              // Auto-resize height
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
                if (canSend) send();
              }
            }}
            disabled={isLoading}
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
            aria-label="Send message"
          >
            {isLoading ? (
              <Sparkles className="w-5 h-5 animate-pulse" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* FOOTER INFO */}
        <div className="px-4 pb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {images.length > 0 && (
            <span className="text-violet-500 font-medium">
              {images.length} image{images.length !== 1 ? "s" : ""} attached
            </span>
          )}
        </div>
      </div>
    </div>
  );
}