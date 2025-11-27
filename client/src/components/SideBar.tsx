import { useState} from 'react';
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
  const { messages, conversations, newConversation, switchConversation, deleteConversation, activeConversationId } = useChatStore();

  // Build the list of chats (active unsaved + saved conversations)
  const currentTitle = messages.length > 0 ? 'Current Conversation' : 'No Conversation';

  const chatEntries: Chat[] = [
    { id: 'current', title: currentTitle, timestamp: messages.length > 0 ? `${messages.length} message${messages.length > 1 ? 's' : ''}` : '—' },
    ...conversations.map((c) => ({ id: c.id, title: c.title, timestamp: c.createdAt })),
  ];

  const filteredChats = chatEntries.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden sticky top-0 h-screen z-10`}
      >
        {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/assets/robotLogo.jpg" alt="Flur Chat" className="h-8 w-8 rounded-full" />
              <div className="text-sm font-semibold text-slate-700">Flur Chat</div>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-linear-to-r from-violet-500 to-indigo-500 text-white rounded-lg hover:scale-[1.02] transition-transform shadow-md"
              onClick={() => newConversation()}
              title="Start a new chat (saves the current one)"
            >
              <Plus size={16} />
              <span className="text-sm font-medium">New</span>
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
            <div
              key={chat.id}
              role="button"
              tabIndex={0}
              className={`w-full text-left px-3 py-3 rounded-lg hover:bg-slate-100 transition-colors mb-1 group cursor-pointer ${((chat.id === 'current' && activeConversationId === null) || activeConversationId === chat.id) ? 'bg-slate-100' : ''}`}
              onClick={() => {
                if (chat.id === 'current') {
                  switchConversation('current');
                } else {
                  switchConversation(chat.id);
                }
                const el = document.getElementById('messages-list');
                el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (chat.id === 'current') switchConversation('current'); else switchConversation(chat.id);
                  const el = document.getElementById('messages-list');
                  el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                }
              }}
            >
              <div className="flex items-start gap-3">
                <MessageSquare size={18} className="text-slate-400 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    { (chat.id === 'current' && messages.length > 0) ? `${messages[messages.length - 1].role}: ${String(messages[messages.length - 1].content).slice(0,50)}${String(messages[messages.length - 1].content).length > 50 ? '…' : ''}` : (chat.id !== 'current' ? (new Date(chat.timestamp).toLocaleString() || chat.timestamp) : 'No messages yet') }
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (chat.id !== 'current') deleteConversation(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-red-500 p-1 transition-opacity"
                  aria-label="Delete chat"
                >
                  Delete
                </button>
              </div>
            </div>
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