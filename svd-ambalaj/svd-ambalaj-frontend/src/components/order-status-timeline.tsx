"use client";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderStatusTimelineProps {
  status: OrderStatus | string;
  variant?: "horizontal" | "vertical" | "mini";
  createdAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

const steps = [
  { key: "pending", label: "Sipariş Alındı", icon: "clipboard" },
  { key: "processing", label: "Hazırlanıyor", icon: "cog" },
  { key: "shipped", label: "Kargoda", icon: "truck" },
  { key: "delivered", label: "Teslim Edildi", icon: "check" },
];

const statusOrder: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

function getStepStatus(stepIndex: number, currentStatus: string): "completed" | "active" | "pending" {
  const currentIndex = statusOrder[currentStatus] ?? 0;
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

function StepIcon({ type, status }: { type: string; status: "completed" | "active" | "pending" }) {
  const baseClass = "h-5 w-5";

  if (status === "completed") {
    return (
      <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  switch (type) {
    case "clipboard":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "cog":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "truck":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case "check":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export function OrderStatusTimeline({ status, variant = "horizontal", createdAt, shippedAt, deliveredAt }: OrderStatusTimelineProps) {
  const normalizedStatus = status.toLowerCase();
  const isCancelled = normalizedStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 border border-red-200">
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-sm font-medium text-red-700">Sipariş İptal Edildi</span>
      </div>
    );
  }

  // Mini variant - just dots
  if (variant === "mini") {
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(index, normalizedStatus);
          return (
            <div
              key={step.key}
              className={`h-2 w-2 rounded-full transition-colors ${
                stepStatus === "completed"
                  ? "bg-green-500"
                  : stepStatus === "active"
                  ? "bg-amber-500"
                  : "bg-slate-200"
              }`}
              title={step.label}
            />
          );
        })}
      </div>
    );
  }

  // Vertical variant
  if (variant === "vertical") {
    return (
      <div className="space-y-0">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(index, normalizedStatus);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    stepStatus === "completed"
                      ? "border-green-500 bg-green-500 text-white"
                      : stepStatus === "active"
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  <StepIcon type={step.icon} status={stepStatus} />
                </div>
                {!isLast && (
                  <div
                    className={`h-8 w-0.5 ${
                      stepStatus === "completed" ? "bg-green-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
              <div className="pb-8">
                <p
                  className={`text-sm font-medium ${
                    stepStatus === "completed"
                      ? "text-green-700"
                      : stepStatus === "active"
                      ? "text-amber-700"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                {stepStatus === "completed" && index === 0 && createdAt && (
                  <p className="text-xs text-slate-500">
                    {new Date(createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {stepStatus === "completed" && index === 2 && shippedAt && (
                  <p className="text-xs text-slate-500">
                    {new Date(shippedAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {stepStatus === "completed" && index === 3 && deliveredAt && (
                  <p className="text-xs text-slate-500">
                    {new Date(deliveredAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(index, normalizedStatus);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    stepStatus === "completed"
                      ? "border-green-500 bg-green-500 text-white"
                      : stepStatus === "active"
                      ? "border-amber-500 bg-amber-50 text-amber-600 ring-4 ring-amber-100"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  <StepIcon type={step.icon} status={stepStatus} />
                </div>
                <p
                  className={`mt-2 text-xs font-medium text-center ${
                    stepStatus === "completed"
                      ? "text-green-700"
                      : stepStatus === "active"
                      ? "text-amber-700"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {!isLast && (
                <div
                  className={`mx-2 h-1 flex-1 rounded-full ${
                    stepStatus === "completed" ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "delivered":
      return "border-green-200 bg-green-50 text-green-700";
    case "shipped":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "processing":
    case "confirmed":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "pending":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "delivered":
      return "Teslim Edildi";
    case "shipped":
      return "Kargoda";
    case "processing":
      return "Hazırlanıyor";
    case "confirmed":
      return "Onaylandı";
    case "pending":
      return "Beklemede";
    case "cancelled":
      return "İptal Edildi";
    default:
      return status;
  }
}
