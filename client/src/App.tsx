import ChatInput from './components/ChatInput'
import MessagesList from './components/MessagesList'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1">
        <MessagesList />
      </main>

      <footer>
        <ChatInput />
      </footer>
    </div>
  )
}

export default App
