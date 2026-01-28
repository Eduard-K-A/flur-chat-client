import { useEffect, useState } from "react";
import ChatInput from "./components/ChatInput";
import MessagesList from "./components/MessagesList";
import ChatbotSidebar from "./components/SideBar";
import SettingsButton from "./Buttons/SettingsButton";
import Settings from "./settings/Settings";

type Theme = "light" | "dark";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  // Apply theme to document root so global styles can react
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div
      className={`h-screen flex overflow-hidden ${
        theme === "dark" ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      <ChatbotSidebar isOpen={isSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-2 rounded-md hover:bg-slate-100 transition-colors"
            >
              {isSidebarOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M6 6h12M6 12h12M6 18h12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <div className="text-sm text-slate-500">Flur Chat</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle in header */}
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <span
                className={`inline-block w-5 h-5 rounded-full ${
                  theme === "dark" ? "bg-slate-900" : "bg-amber-300"
                }`}
              />
              <span>{theme === "dark" ? "Dark" : "Light"} mode</span>
            </button>

            {/* Settings button opens modal */}
            <SettingsButton onClick={() => setShowSettings(true)} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0 w-full p-0 m-0">
          <MessagesList />
        </div>

        <footer className="shrink-0">
          <ChatInput />
        </footer>
      </main>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-5 relative">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              aria-label="Close settings"
            >
              <span className="block w-4 h-4 relative">
                <span className="absolute inset-0 rotate-45 border-t-2 border-slate-500" />
                <span className="absolute inset-0 -rotate-45 border-t-2 border-slate-500" />
              </span>
            </button>

            <Settings
              theme={theme}
              onThemeChange={(next) => {
                setTheme(next);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
