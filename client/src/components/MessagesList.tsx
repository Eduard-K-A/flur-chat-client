import React from "react";
import { useChatStore } from "../stores/useChatStore";

export default function MessagesList() {
  const { messages } = useChatStore();

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-400">No messages yet</div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[78%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-violet-500 text-white rounded-br-none"
                  : "bg-slate-100 text-slate-800 rounded-bl-none"
              }`}
            >
              {m.content || (m.images && m.images.length > 0 ? "[image]" : "")}

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
      </div>
    </div>
  );
}
