import { VIPStatus } from "@/context/AuthContext";

type VIPBadgeProps = {
  vipStatus: VIPStatus | null;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
};

export function VIPBadge({ vipStatus, size = "md", showDiscount = true }: VIPBadgeProps) {
  if (!vipStatus?.tier) return null;

  const tierConfig = {
    platinum: {
      label: "Platinum",
      icon: "💎",
      gradient: "from-slate-300 to-slate-500",
      textColor: "text-slate-900",
    },
    gold: {
      label: "Gold",
      icon: "🥇",
      gradient: "from-amber-300 to-amber-500",
      textColor: "text-amber-900",
    },
    silver: {
      label: "Silver",
      icon: "🥈",
      gradient: "from-gray-300 to-gray-500",
      textColor: "text-gray-900",
    },
    bronze: {
      label: "Bronze",
      icon: "🥉",
      gradient: "from-orange-300 to-orange-500",
      textColor: "text-orange-900",
    },
  };

  const config = tierConfig[vipStatus.tier];
  if (!config) return null;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r ${config.gradient} ${config.textColor} ${sizeClasses[size]} font-bold shadow-md border border-white/30`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {showDiscount && vipStatus.discount > 0 && (
        <span className="ml-0.5 text-[10px] opacity-90">%{vipStatus.discount}</span>
      )}
    </span>
  );
}

type VIPProgressProps = {
  vipStatus: VIPStatus | null;
  stats?: {
    totalOrdersValue: number;
    totalOrdersCount: number;
    quoteToOrderConversion: number;
  };
};

export function VIPProgress({ vipStatus, stats }: VIPProgressProps) {
  if (!stats) return null;

  const tiers = [
    { name: "bronze", minValue: 5000, label: "Bronze 🥉", discount: 5 },
    { name: "silver", minValue: 15000, label: "Silver 🥈", discount: 10 },
    { name: "gold", minValue: 30000, label: "Gold 🥇", discount: 15 },
    { name: "platinum", minValue: 50000, label: "Platinum 💎", discount: 20 },
  ];

  const currentTier = vipStatus?.tier || null;
  const currentValue = stats.totalOrdersValue;

  // Find next tier
  const currentTierIndex = tiers.findIndex((t) => t.name === currentTier);
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;

  if (!nextTier) {
    // Already at max tier
    return (
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-purple-900">Maksimum VIP Seviyesindesiniz!</p>
            <p className="text-sm text-purple-700">%{vipStatus?.discount} sürekli indirimden yararlanıyorsunuz.</p>
          </div>
        </div>
      </div>
    );
  }

  const remaining = nextTier.minValue - currentValue;
  const progress = (currentValue / nextTier.minValue) * 100;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-amber-900">Sonraki VIP Seviyesi</p>
          <p className="text-sm text-amber-700">{nextTier.label}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-600">%{nextTier.discount}</p>
          <p className="text-xs text-amber-600">indirim</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2 h-3 overflow-hidden rounded-full bg-amber-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <p className="text-sm text-amber-700">
        <span className="font-semibold">
          {remaining.toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 0,
          })}
        </span>{" "}
        daha sipariş verin ve <strong>{nextTier.label}</strong> olun!
      </p>
    </div>
  );
}
