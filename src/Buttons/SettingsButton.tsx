type SettingsButtonProps = {
  onClick: () => void;
};

function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
    >
      <span className="w-4 h-4 inline-block rounded-full border border-slate-400 mr-1" />
      <span>Settings</span>
    </button>
  );
}

export default SettingsButton;
