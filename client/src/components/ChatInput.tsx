import { useState } from "react";
import { Send, Paperclip, X, Image, Sparkles } from "lucide-react";
import { useChatStore } from "../stores/useChatStore";
import { sendChat } from "../lib/api";


export default function ChatInput() {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showSystemEditor, setShowSystemEditor] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { addMessage, appendToLastMessage, setLoading, isLoading, systemPrompt, setSystemPrompt } = useChatStore();

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImages((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if (!text.trim() && images.length === 0) return;

    const userContent: any = text.trim() ? [{ type: "text", text }] : [];
    images.forEach((img) =>
      userContent.push({ type: "image_url", image_url: { url: img } })
    );

    addMessage({ role: "user", content: text, images });
    setText("");
    setImages([]);
    setLoading(true);
    addMessage({ role: "assistant", content: "" });

    // Build the messages payload to include the system prompt (if set) as
    // the first message. We avoid adding the system prompt to the UI messages
    // so it stays hidden from the chat history but influences model behavior.
    const currentMessages = useChatStore.getState().messages.slice(0, -1);
    const payloadMessages: any[] = [];
    if (systemPrompt && String(systemPrompt).trim()) {
      // Only add system prompt if not already present at the beginning of payload
      const firstIsSystem = currentMessages[0]?.role === "system";
      if (!firstIsSystem) payloadMessages.push({ role: "system", content: systemPrompt });
    }
    payloadMessages.push(...currentMessages);
    payloadMessages.push({ role: "user", content: userContent.length === 1 ? text : userContent });

    const reader = await sendChat(payloadMessages);

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const json = line.slice(6);
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const token = parsed.choices[0]?.delta?.content || "";
            if (token) appendToLastMessage(token);
          } catch {}
        }
      }
    }
    setLoading(false);
  };

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
        {/* Image Preview */}
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
                    className="h-20 w-20 object-cover"
                    alt={`Upload ${i + 1}`}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white 
                               opacity-0 group-hover:opacity-100 transition-all
                               hover:bg-red-500 hover:scale-110"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
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
                    e.target.files && Array.from(e.target.files).forEach(processImage)
                  }
                />
              </label>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 p-2">
          <label
            className="p-2.5 rounded-xl text-slate-400 hover:text-violet-500 
                       hover:bg-violet-50 cursor-pointer transition-colors"
          >
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && Array.from(e.target.files).forEach(processImage)
              }
            />
          </label>

          {/* Toggle the system prompt editor */}
          <button
            type="button"
            onClick={() => setShowSystemEditor((v) => !v)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 cursor-pointer transition-colors"
            title="Edit system prompt"
          >
            <Sparkles className="w-5 h-5" />
          </button>

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
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />

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

        {/* Hint Text */}
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