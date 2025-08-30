// src/features/posts/components/ModeTabs.jsx
export default function ModeTabs({ mode, setMode, disabled = false, onReset }) {
  const modes = ['POST', '24DROP', 'VDROP'];

  const changeMode = (next) => {
    if (disabled || next === mode) return;
    onReset?.();
    setMode(next);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    const i = modes.indexOf(mode);
    if (i < 0) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      changeMode(modes[(i + 1) % modes.length]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      changeMode(modes[(i - 1 + modes.length) % modes.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      changeMode(modes[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      changeMode(modes[modes.length - 1]);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Post mode"
      className="flex mb-4 space-x-2"
      onKeyDown={onKeyDown}
    >
      {modes.map((m) => {
        const selected = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${m}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => changeMode(m)}
            disabled={disabled}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors
              ${selected ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}
              ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={m}
            data-mode={m}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
