import { SettingsButton } from "./SettingsButton";

type SettingsSaveBarProps = {
  show: boolean;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  message?: string;
};

export function SettingsSaveBar({
  show,
  onSave,
  onCancel,
  saving,
  message = "Kaydedilmemiş değişiklikleriniz var",
}: SettingsSaveBarProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-500 shadow-lg z-50 animate-slide-up">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{message}</p>
              <p className="text-xs text-slate-600">
                Değişiklikleri kaydetmeden çıkarsanız kaybolacaktır.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <SettingsButton
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              İptal Et
            </SettingsButton>
            <SettingsButton onClick={onSave} loading={saving}>
              Değişiklikleri Kaydet
            </SettingsButton>
          </div>
        </div>
      </div>
    </div>
  );
}
