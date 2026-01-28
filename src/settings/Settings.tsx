type SettingsProps = {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
};

function Settings({ theme, onThemeChange }: SettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Settings</h2>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-slate-700">Appearance</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onThemeChange("light")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
              theme === "light"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => onThemeChange("dark")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
              theme === "dark"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            Dark
          </button>
        </div>
      </section>
    </div>
  );
}

export default Settings;
