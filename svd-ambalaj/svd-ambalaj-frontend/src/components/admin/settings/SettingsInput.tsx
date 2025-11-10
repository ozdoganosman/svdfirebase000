import { InputHTMLAttributes } from "react";

type SettingsInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function SettingsInput({ error, className = "", ...props }: SettingsInputProps) {
  return (
    <input
      className={`
        w-full px-4 py-2 text-sm border rounded-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        ${
          error
            ? "border-red-300 bg-red-50"
            : "border-slate-300 bg-white hover:border-slate-400"
        }
        disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}
