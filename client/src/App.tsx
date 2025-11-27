import { useState } from 'react'
import ChatInput from './components/ChatInput'
import MessagesList from './components/MessagesList'
import ChatbotSidebar from './components/SideBar'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ChatbotSidebar isOpen={isSidebarOpen} />

      <main className="flex-1 flex flex-col">
        <header className="p-3 border-b border-slate-200 bg-white flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className="p-2 rounded-md hover:bg-slate-100 transition-colors"
          >
            {isSidebarOpen ? <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M6 6h12M6 12h12M6 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
          <div className="text-sm text-slate-500">Flur Chat</div>
        </header>
        <div className="flex-1 overflow-auto">
          <MessagesList />
        </div>

        <footer>
          <ChatInput />
        </footer>
      </main>
    </div>
  )
}

export default App
