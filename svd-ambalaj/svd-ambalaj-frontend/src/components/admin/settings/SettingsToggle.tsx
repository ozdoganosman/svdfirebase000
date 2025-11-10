type SettingsToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
};

export function SettingsToggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: SettingsToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors
            peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-100
            ${disabled ? "bg-slate-200 cursor-not-allowed" : "bg-slate-300 group-hover:bg-slate-400"}
          `}
        >
          <div
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
              ${checked ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </div>
      </div>
      {label && (
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-900">{label}</div>
          {description && (
            <div className="text-xs text-slate-500 mt-1">{description}</div>
          )}
        </div>
      )}
    </label>
  );
}
