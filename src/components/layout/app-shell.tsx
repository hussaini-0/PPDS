import Link from "next/link";
import {
  BarChart3,
  BadgeCheck,
  PanelsTopLeft,
  Settings2,
  MessageSquareMore,
  Megaphone,
  UsersRound,
  WalletCards,
  ShoppingBag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: PanelsTopLeft },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquareMore },
  { href: "/dashboard/contacts", label: "Contacts", icon: UsersRound },
  { href: "/dashboard/payments", label: "Payments", icon: WalletCards },
  { href: "/dashboard/orders", label: "Store Orders", icon: ShoppingBag },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: BadgeCheck },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/dashboard/meta", label: "Meta Ads", icon: BarChart3 },
  { href: "/dashboard/cms", label: "Website CMS", icon: Settings2 },
];

export function AppShell({
  children,
  businessName,
  role,
  mode,
}: {
  children: React.ReactNode;
  businessName: string;
  role: string;
  mode: "mock" | "live";
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(24,199,216,0.12),_transparent_28%),linear-gradient(180deg,#07111f_0%,#0f172a_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-4 py-6 lg:px-6 xl:px-8">
        <aside className="hidden w-64 shrink-0 rounded-[2rem] border border-white/70 bg-zinc-950 p-5 text-white shadow-2xl lg:block">
          <div className="space-y-3">
            <ThemeToggle className="border-white/15 bg-white/10 text-white hover:bg-white/15" />
            <Badge tone={mode === "mock" ? "warning" : "success"}>
              {mode === "mock" ? "Mock Mode" : "Live Mode"}
            </Badge>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                Business
              </p>
              <h1 className="mt-2 text-2xl font-semibold">{businessName}</h1>
              <p className="mt-1 text-sm text-zinc-400">{role} session</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/8 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <nav className="mb-4 flex gap-2 overflow-x-auto rounded-2xl bg-zinc-950 p-2 text-white lg:hidden" aria-label="Dashboard navigation">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-200 hover:bg-white/10">
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
