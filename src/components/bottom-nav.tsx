"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Dices,
  BarChart3,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";

const baseItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/partidos", label: "Partidos", icon: CalendarDays },
  { href: "/apuestas", label: "Apuestas", icon: Dices },
  { href: "/clasificacion", label: "Ranking", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: User },
];

const adminItem = { href: "/admin", label: "Admin", icon: Settings };

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {[...baseItems, ...(isAdmin ? [adminItem] : [])].map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
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
              <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
