import { ReactNode } from "react";

type SettingsFieldProps = {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

export function SettingsField({
  label,
  description,
  required,
  error,
  children,
}: SettingsFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      <div>{children}</div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
