"use client";

export function FunnelChart({
  applied,
  interview,
  offer,
}: {
  applied: number;
  interview: number;
  offer: number;
}) {
  const max = Math.max(applied, 1);
  const steps = [
    { label: "Applied", value: applied, color: "bg-blue-500", width: "100%" },
    {
      label: "Interview",
      value: interview,
      color: "bg-yellow-500",
      width: `${Math.max(30, (interview / max) * 100)}%`,
    },
    {
      label: "Offer",
      value: offer,
      color: "bg-green-500",
      width: `${Math.max(20, (offer / max) * 100)}%`,
    },
  ];

  return (
    <div className="space-y-3 py-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-col items-center">
          <div
            className={`${step.color} text-white text-sm font-medium py-3 rounded-lg text-center transition-all`}
            style={{ width: step.width, minWidth: "8rem" }}
          >
            {step.label}: {step.value}
          </div>
          {i < steps.length - 1 && (
            <span className="text-gray-400 text-lg leading-none py-1" aria-hidden>
              ↓
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
