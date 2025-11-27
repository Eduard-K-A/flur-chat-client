import React, { useState } from 'react';
import { MessageSquare, Plus, Search, Settings } from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';

interface Chat {
  id: string;
  title: string;
  timestamp: string;
}

interface SideBarProps {
  isOpen: boolean;
}

export default function ChatbotSidebar({ isOpen }: SideBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { messages, clear } = useChatStore();

  // We show a single 'Current conversation' entry to match the simple chat
  // store. This enables the sidebar to reflect what's in the store and let
  // the user start over.
  const chats: Chat[] = [
    {
      id: 'current',
      title: messages.length > 0 ? 'Current Conversation' : 'No Conversation',
      timestamp:
        messages.length > 0
          ? `${messages.length} message${messages.length > 1 ? 's' : ''}`
          : '—',
    },
  ];

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden`}
      >
        {/* Header */}
          <div className="p-4 border-b border-slate-200">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-violet-500 to-indigo-500 text-white rounded-lg hover:scale-[1.02] transition-transform shadow-md"
            onClick={() => clear()}
          >
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-100 transition-colors mb-1 group"
              onClick={() => {
                // On click, focus messages list if available.
                const el = document.getElementById('messages-list');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="flex items-start gap-3">
                <MessageSquare size={18} className="text-slate-400 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {messages.length > 0 ? `${messages[messages.length - 1].role}: ${String(messages[messages.length - 1].content).slice(0,50)}${String(messages[messages.length - 1].content).length > 50 ? '…' : ''}` : 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings size={20} />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* End Sidebar */}
    </div>
  );
}