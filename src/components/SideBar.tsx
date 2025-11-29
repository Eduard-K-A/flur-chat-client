import { useState } from 'react';
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
  // Local UI-only state for search input.
  const [searchQuery, setSearchQuery] = useState('');

  // Zustand global store values + actions.
  // messages = active conversation messages
  // conversations = saved chat histories
  // newConversation = saves current chat and starts fresh
  // switchConversation = loads another conversation (or "current")
  // deleteConversation = remove saved conversation
  // activeConversationId = which conversation is selected
  const {
    // messages (active) not used here; we rely on unsavedMessages for 'current' preview
    unsavedMessages,
    conversations,
    newConversation,
    switchConversation,
    deleteConversation,
    activeConversationId
  } = useChatStore();

  // Title for the "current conversation"
  // If the user hasn’t typed anything yet, show "No Conversation".
  const currentTitle = unsavedMessages.length > 0
    ? 'Current Conversation'
    : 'No Conversation';

  // Build combined list:
  // 1) The unsaved current conversation (id: "current")
  // 2) All saved conversations from Zustand
  //
  // This makes it easier to render them all uniformly in the sidebar.
  const chatEntries: Chat[] = [
    {
      id: 'current',
      title: currentTitle,
      // If there are messages, show total count. Otherwise show placeholder.
      timestamp: unsavedMessages.length > 0
        ? `${unsavedMessages.length} message${unsavedMessages.length > 1 ? 's' : ''}`
        : '—'
    },
    // Spread saved conversations and convert to Chat objects
    ...conversations.map((c) => ({
      id: c.id,
      title: c.title,
      timestamp: c.createdAt
    }))
  ];

  // Search filter:
  // Compare chat titles in lowercase to match searchQuery.
  const filteredChats = chatEntries.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar container with animation based on isOpen */}
      <div
        className={`${isOpen ? 'w-64' : 'w-0'}
        transition-all duration-300 bg-white border-r border-slate-200
        flex flex-col overflow-hidden sticky top-0 h-screen z-10`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/robotLogo.jpg" alt="Flur Chat" className="h-8 w-8 rounded-full" />
            <div className="text-sm font-semibold text-slate-700">Flur Chat</div>
          </div>

          {/* Clicking this:
             1. Saves the current conversation (if any)
             2. Clears the active messages
             3. Starts a new "current" chat */}
          <button
            className="flex items-center gap-2 px-3 py-2 bg-linear-to-r from-violet-500 to-indigo-500 text-white rounded-lg hover:scale-[1.02] transition-transform shadow-md"
            onClick={() => newConversation()}
            title="Start a new chat (saves the current one)"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">New</span>
          </button>
        </div>

        {/* Search input */}
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

        {/* Chat History list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              role="button"
              tabIndex={0}

              // Highlight if:
              // - This is the "current" chat AND no saved conversation is active
              // - OR its ID matches activeConversationId
              className={`w-full text-left px-3 py-3 rounded-lg hover:bg-slate-100 transition-colors mb-1 group cursor-pointer
              ${((chat.id === 'current' && activeConversationId === null) ||
                activeConversationId === chat.id)
                ? 'bg-slate-100'
                : ''}`
              }

              // Switching conversation:
              // If "current": load unsaved messages
              // Else: load saved conversation from store
              onClick={() => {
                if (chat.id === 'current') {
                  switchConversation('current');
                } else {
                  switchConversation(chat.id);
                }

                // Scroll messages list to bottom after switching
                const el = document.getElementById('messages-list');
                el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
              }}

              // Keyboard accessibility for Enter/Space
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (chat.id === 'current') switchConversation('current');
                  else switchConversation(chat.id);

                  const el = document.getElementById('messages-list');
                  el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                }
              }}
            >
              <div className="flex items-start gap-3">
                <MessageSquare size={18} className="text-slate-400 mt-1 shrink-0" />

                {/* Chat title + preview */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {chat.title}
                  </p>

                  {/* Logic for preview message:
                     - If it's the current chat and there are messages,
                       show the last message's role + first 50 chars.
                     - If it's a saved chat, show the formatted timestamp.
                     - If current and empty, show “No messages yet”. */}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(chat.id === 'current' && unsavedMessages.length > 0)
                      ? `${unsavedMessages[unsavedMessages.length - 1].role}: ${String(unsavedMessages[unsavedMessages.length - 1].content).slice(0, 50)}${String(unsavedMessages[unsavedMessages.length - 1].content).length > 50 ? '…' : ''}`
                      : (
                        chat.id !== 'current'
                          ? (new Date(chat.timestamp).toLocaleString() || chat.timestamp)
                          : 'No messages yet'
                      )
                    }
                  </p>
                </div>

                {/* Delete button (hidden until hover)
                   Prevents click from selecting the chat. */}
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

        {/* Footer settings button */}
        <div className="p-4 border-t border-slate-200">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings size={20} />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
