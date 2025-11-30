import React from "react";
import { useChatStore } from "../stores/useChatStore";

export default function MessagesList() {
  // Access global chat state (messages + loading indicator)
  const { messages, isLoading } = useChatStore();

  // Ref for the scrollable container to auto-scroll to bottom
  const containerRef = React.useRef<HTMLDivElement>(null);

  // AUTO-SCROLL TO BOTTOM WHEN NEW MESSAGES ARRIVE
  React.useEffect(() => {
    const el = containerRef.current;
    // Ensure the container exists before scrolling
    if (el) el.scrollTo({ 
      top: el.scrollHeight, // scroll to the very bottom
      behavior: "smooth"    // smooth scrolling animation
    });
  }, [messages]); 
  // Effect runs ONLY when `messages` changes

  // Determine if the last message is from the assistant
  // This affects the typing indicator alignment
  const last = messages[messages.length - 1];
  const lastIsAssistant = last?.role === "assistant";

  return (
    <div
      id="messages-list"
      ref={containerRef}
      className="w-full p-4"
    >
      <div className="flex flex-col gap-4">

        {/* Show placeholder when chat is empty */}
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-400">
            No messages yet
          </div>
        )}

        {/* RENDER EACH MESSAGE */}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              // Align messages depending on role
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >

            {/* Avatar only for assistant messages */}
            {m.role === "assistant" && (
              <img
                src="/assets/robotLogo.jpg"
                alt="AI"
                className="h-8 w-8 rounded-full shrink-0 mt-1"
              />
            )}

            {/* MESSAGE BUBBLE */}
            <div
              className={`max-w-[75%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-violet-500 text-white rounded-br-none"
                  : "bg-slate-100 text-slate-800 rounded-bl-none"
              }`}
            >
              {/* TEXT OR IMAGE PLACEHOLDER */}
              {m.content || (m.images && m.images.length > 0 ? "[image]" : "")}

              {/* IMAGE PREVIEW INSIDE MESSAGE */}
              {m.images && m.images.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {m.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`img-${i}`}
                      className="h-24 w-24 object-cover rounded-md border"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ASSISTANT TYPING INDICATOR */}
        {isLoading && (
          <div className="flex items-start gap-3">

            {/* If last message was NOT from assistant, show avatar */}
            {!lastIsAssistant ? (
              <img
                src="/assets/robotLogo.jpg"
                alt="AI"
                className="h-8 w-8 rounded-full shrink-0 mt-1"
              />
            ) : (
              // If last was assistant, keep spacing aligned
              <div className="w-8" />
            )}

            {/* Animated dots to show “AI is typing” */}
            <div className="max-w-[75%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap bg-slate-100 text-slate-800 rounded-bl-none">
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
