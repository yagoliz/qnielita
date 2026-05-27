import Link from "next/link";
import { LayoutGrid, Swords } from "lucide-react";
import type { TabView } from "@/lib/match-tree";

export type BracketStatus = "not_open" | "open" | "locked";

type Props = {
  activeTab: TabView;
  knockoutAvailable: boolean;
  bracketStatus: BracketStatus;
};

function tabClass(active: boolean) {
  return active
    ? "bg-white shadow-sm text-green-600"
    : "text-gray-500";
}

export function PartidosTabs({ activeTab, bracketStatus }: Props) {
  const grupos = activeTab === "grupos";
  const eliminatorias = activeTab === "eliminatorias";

  const base = "flex-1 py-2 text-sm font-medium rounded-md text-center";

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
      <Link
        href="/partidos?tab=grupos"
        className={`${base} ${tabClass(grupos)}`}
        aria-current={grupos ? "page" : undefined}
      >
        <LayoutGrid className="size-4 inline mr-1" /> Grupos
      </Link>

      {bracketStatus !== "not_open" ? (
        <Link
          href="/partidos?tab=eliminatorias"
          className={`${base} ${tabClass(eliminatorias)}`}
          aria-current={eliminatorias ? "page" : undefined}
        >
          <Swords className="size-4 inline mr-1" /> Eliminatorias
        </Link>
      ) : (
        <Link
          href="/partidos?tab=eliminatorias"
          className={`${base} ${tabClass(eliminatorias)} opacity-60`}
          aria-current={eliminatorias ? "page" : undefined}
        >
          <Swords className="size-4 inline mr-1" /> Eliminatorias
        </Link>
      )}
    </div>
  );
}