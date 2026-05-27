import Link from "next/link";
import type { TabView } from "@/lib/match-tree";

type Props = {
  activeTab: TabView;
  knockoutAvailable: boolean;
};

function tabClass(active: boolean) {
  return active
    ? "text-green-600 border-b-2 border-green-600"
    : "text-gray-500 border-b border-gray-200 hover:text-gray-700";
}

export function PartidosTabs({ activeTab, knockoutAvailable }: Props) {
  const grupos = activeTab === "grupos";
  const eliminatorias = activeTab === "eliminatorias";

  return (
    <nav className="grid grid-cols-2 mb-4" aria-label="Secciones de partidos">
      <Link
        href="/partidos?tab=grupos"
        className={`text-center py-3 text-sm font-medium ${tabClass(grupos)}`}
        aria-current={grupos ? "page" : undefined}
      >
        Fase de Grupos
      </Link>

      {knockoutAvailable ? (
        <Link
          href="/partidos?tab=eliminatorias"
          className={`text-center py-3 text-sm font-medium ${tabClass(eliminatorias)}`}
          aria-current={eliminatorias ? "page" : undefined}
        >
          Eliminatorias
        </Link>
      ) : (
        <span
          className="text-center py-3 text-sm font-medium text-gray-300 border-b border-gray-200 cursor-not-allowed"
          aria-disabled="true"
        >
          Eliminatorias <span className="text-xs">· próximamente</span>
        </span>
      )}
    </nav>
  );
}