import React from "react";
import { useChatStore } from "../stores/useChatStore";

export default function MessagesList() {
  const { messages, isLoading } = useChatStore();
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const last = messages[messages.length - 1];
  const lastIsAssistant = last?.role === "assistant";

  return (
    <div id="messages-list" ref={containerRef} className="mx-auto max-w-3xl p-4 h-full overflow-y-auto">
      <div className="flex flex-col gap-4">
        {messages.length === 0 && <div className="text-center text-sm text-slate-400">No messages yet</div>}

        {messages.map((m) => (
          <div key={m.id} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <img src="/assets/robotLogo.jpg" alt="AI" className="h-8 w-8 rounded-full shrink-0 mt-1" />
            )}

            <div
              className={`max-w-[78%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "bg-violet-500 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"
              }`}
            >
              {m.content || (m.images && m.images.length > 0 ? "[image]" : "")}

              {m.images && m.images.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {m.images.map((src, i) => (
                    <img key={i} src={src} alt={`img-${i}`} className="h-24 w-24 object-cover rounded-md border" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            {!lastIsAssistant ? (
              <img src="/assets/robotLogo.jpg" alt="AI" className="h-8 w-8 rounded-full shrink-0 mt-1" />
            ) : (
              <div className="w-8" />
            )}
            <div className="max-w-[78%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-100 text-slate-800 rounded-bl-none">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-slate-600 rounded-full animate-pulse" />
                <span className="h-2 w-2 bg-slate-600 rounded-full animate-pulse" />
                <span className="h-2 w-2 bg-slate-600 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}