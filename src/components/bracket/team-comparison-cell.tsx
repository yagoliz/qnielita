import { TeamFlag } from "../team-flag";
import type { TeamSlot } from "@/lib/bracket-team-comparison";

type Props = {
  slot: TeamSlot;
  align: "left" | "right";
  showFlag?: boolean;
};

export function TeamComparisonCell({ slot, align, showFlag = false }: Props) {
  const isRight = align === "right";
  const name = slot.predicted?.name ?? "?";
  const code = slot.predicted?.code ?? "";

  return (
    <div className={`flex-1 ${isRight ? "text-right" : "text-left"}`}>
      <p className="font-semibold text-sm">{name}</p>
      <div
        className={`flex items-center gap-1.5 ${
          isRight ? "justify-end" : "justify-start"
        }`}
      >
        {!isRight && showFlag && <TeamFlag code={code} />}
        <span className="text-xs text-gray-400">{code}</span>
        {isRight && showFlag && <TeamFlag code={code} />}
      </div>

      {slot.status !== "unknown" && slot.actual && (
        <div className={`mt-1 flex ${isRight ? "justify-end" : "justify-start"}`}>
          <span
            title={slot.actual.name}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              slot.status === "correct"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {slot.actual.code}
          </span>
        </div>
      )}
    </div>
  );
}