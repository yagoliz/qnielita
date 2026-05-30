import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Reglas y Puntuación — Qnielita",
  description:
    "Cómo funciona Qnielita: predicciones de partidos, apuestas y puntuación de la porra del Mundial 2026.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

export default function ReglasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <header className="mb-6">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
            Qnielita <Trophy className="size-6 text-green-600" />
          </h1>
          <p className="mt-1 text-center text-gray-500">
            Reglas y puntuación — Porra Mundial 2026
          </p>
        </header>

        <div className="space-y-4">
          <Section title="¿Cómo funciona?">
            <p>
              Qnielita es una porra privada para predecir el Mundial 2026. A lo
              largo del torneo vas sumando puntos con tus aciertos y compites
              con el resto del grupo en la clasificación.
            </p>
            <p>Hay cuatro formas de puntuar:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Partidos:</strong> predices el resultado de cada
                partido de la fase de grupos antes de que empiece.
              </li>
              <li>
                <strong>Apuestas:</strong> respondes apuestas del torneo
                (campeón, máximo goleador…) y las &ldquo;apuestas locas&rdquo;
                que cree el administrador.
              </li>
              <li>
                <strong>Eliminatorias:</strong> durante la ventana
                habilitada, rellenas todo el cuadro de la fase final.
              </li>
              <li>
                <strong>Clasificación:</strong> la suma de todos tus puntos te
                coloca en el ranking del grupo.
              </li>
            </ul>
            <p className="text-gray-500">
              Cada predicción se bloquea en su fecha límite (el inicio del
              partido o el cierre de la apuesta). Después ya no se puede
              modificar.
            </p>
          </Section>

          <Section title="Puntuación de partidos">
            <p>
              En cada partido de grupos predices el marcador. Los puntos se
              reparten así:
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 font-medium">Acierto</th>
                  <th className="py-2 text-right font-medium">Puntos</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Resultado exacto</td>
                  <td className="py-2 text-right font-semibold">5</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Misma diferencia de goles</td>
                  <td className="py-2 text-right font-semibold">3</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Solo el resultado (1, X o 2)</td>
                  <td className="py-2 text-right font-semibold">2</td>
                </tr>
                <tr>
                  <td className="py-2">Fallo</td>
                  <td className="py-2 text-right font-semibold">0</td>
                </tr>
              </tbody>
            </table>
            <p className="text-gray-500">
              Ojo con los empates: como la diferencia de goles de un empate
              siempre es cero, si aciertas que hay empate pero con otro marcador
              (por ejemplo predices 1-1 y queda 2-2), te llevas 3 puntos.
            </p>
          </Section>

          <Section title="Apuestas (Torneo y Locas)">
            <p>
              Las apuestas del torneo y las &ldquo;apuestas locas&rdquo; son a
              todo o nada: si aciertas la respuesta, te llevas los puntos; si no,
              cero. No hay aciertos parciales.
            </p>
          </Section>

          <Section title="Eliminatorias">
            <p>
              En la fase final rellenas todo el cuadro: para cada cruce eliges
              los equipos y el marcador. Hay dos tipos de puntos.
            </p>

            <h3 className="font-semibold text-gray-900">
              Puntos por equipo (a partir de octavos)
            </h3>
            <p>
              Ganas puntos por cada equipo que aciertes que llega a un cruce,
              sin importar si lo pusiste como local o visitante. Estos puntos
              solo se otorgan desde octavos en adelante (en la primera ronda no
              hay puntos por equipo).
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 font-medium">Ronda</th>
                  <th className="py-2 text-right font-medium">
                    Puntos por equipo
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Octavos</td>
                  <td className="py-2 text-right font-semibold">2</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Cuartos</td>
                  <td className="py-2 text-right font-semibold">4</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Semifinales</td>
                  <td className="py-2 text-right font-semibold">6</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2">Tercer puesto</td>
                  <td className="py-2 text-right font-semibold">6</td>
                </tr>
                <tr>
                  <td className="py-2">Final</td>
                  <td className="py-2 text-right font-semibold">8</td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-semibold text-gray-900">Puntos por marcador</h3>
            <p>
              El marcador se puntúa con la misma escala de los partidos
              (5/3/2/0), pero con un matiz según la ronda:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Dieciseisavos (primera ronda):</strong> el marcador se
                puntúa siempre con la escala normal 5/3/2/0.
              </li>
              <li>
                <strong>Octavos en adelante:</strong> el marcador solo cuenta si
                al menos uno de los equipos que predijiste juega realmente ese
                cruce. El marcador se reorienta desde el lado del equipo
                acertado, así que da igual el orden local/visitante. Si aciertas
                los dos equipos, te llevas los puntos completos; si solo aciertas
                uno, se quedan a la mitad (redondeando hacia abajo).
              </li>
            </ul>
          </Section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
          >
            <ArrowLeft className="size-4" />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}