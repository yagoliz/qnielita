"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseItems = [
  { href: "/inicio", label: "Inicio", icon: "🏠" },
  { href: "/partidos", label: "Partidos", icon: "⚽" },
  { href: "/apuestas", label: "Apuestas", icon: "🎲" },
  { href: "/clasificacion", label: "Ranking", icon: "📊" },
  { href: "/perfil", label: "Perfil", icon: "👤" },
];

const adminItem = { href: "/admin", label: "Admin", icon: "⚙️" };

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {[...baseItems, ...(isAdmin ? [adminItem] : [])].map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                isActive
                  ? "text-green-600 font-semibold"
                  : "text-gray-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
