"use client";

import { useEffect, useState } from "react";
import { LoonMark } from "@/components/LoonMark";

const links = [
  { href: "#stay", label: "The stay" },
  { href: "#water", label: "The water" },
  { href: "#book", label: "Book" },
];

export function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        solid ? "border-b border-bark/10 bg-paper/90 text-bark backdrop-blur" : "text-cream"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <a href="#top" aria-label="The Loony'Bin" className="inline-flex items-center">
          <LoonMark className="aspect-[397/200] h-14 w-auto" />
        </a>
        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Page">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-amber">
              {link.label}
            </a>
          ))}
        </nav>
        <a href="#book" className="rounded-full bg-amber px-4 py-2 text-sm font-medium text-bark">
          Check dates
        </a>
      </div>
    </header>
  );
}
