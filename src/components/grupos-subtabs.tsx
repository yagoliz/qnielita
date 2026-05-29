import Link from "next/link";
import { ListChecks, Table2 } from "lucide-react";

export type GroupView = "predicciones" | "clasificacion";

function tabClass(active: boolean) {
  return active ? "bg-white shadow-sm text-green-600" : "text-gray-500";
}

export function GruposSubtabs({ view }: { view: GroupView }) {
  const base = "flex-1 py-2 text-sm font-medium rounded-md text-center";
  const preds = view === "predicciones";
  const clasif = view === "clasificacion";

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
      <Link
        href="/partidos?tab=grupos&view=predicciones"
        className={`${base} ${tabClass(preds)}`}
        aria-current={preds ? "page" : undefined}
      >
        <ListChecks className="size-4 inline mr-1" /> Predicciones
      </Link>
      <Link
        href="/partidos?tab=grupos&view=clasificacion"
        className={`${base} ${tabClass(clasif)}`}
        aria-current={clasif ? "page" : undefined}
      >
        <Table2 className="size-4 inline mr-1" /> Clasificación
      </Link>
    </div>
  );
}