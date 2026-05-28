"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

type Deadline = {
  label: string;
  targetDate: string;
};

function formatTimeLeft(diff: number): string {
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

export function DeadlineBanner({ deadlines }: { deadlines: Deadline[] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const active = deadlines.filter(
    (d) => new Date(d.targetDate).getTime() > now
  );

  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map((d) => {
        const diff = new Date(d.targetDate).getTime() - now;
        const urgent = diff < 86400000;
        return (
          <div
            key={d.label}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              urgent
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-amber-50 border border-amber-200 text-amber-700"
            }`}
          >
            <Clock className="size-4 shrink-0" />
            <span>
              {d.label}: <span className="font-bold">{formatTimeLeft(diff)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
