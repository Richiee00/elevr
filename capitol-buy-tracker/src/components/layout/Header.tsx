"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/trades", label: "Individual Trades" },
  { href: "/stocks", label: "Stock Aggregation" },
  { href: "/quality", label: "Data Quality" },
];

export function Header() {
  const path = usePathname();
  const sp = useSearchParams();
  // Carry the user's premium setting across screens
  const premium = sp.get("premium");
  const suffix = premium ? `?premium=${premium}` : "";
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href={"/" + suffix} className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded bg-up/15 font-mono text-sm font-bold text-up">CB</span>
          <span className="text-sm font-bold tracking-[0.18em] text-ink">CAPITOL BUY TRACKER</span>
        </Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto text-xs" aria-label="Main">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href + suffix} className={`whitespace-nowrap rounded px-3 py-1.5 ${active ? "bg-panel2 text-ink" : "text-muted hover:text-ink"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
