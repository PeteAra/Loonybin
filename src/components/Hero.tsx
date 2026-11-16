"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { photos } from "@/content/photos";

export function Hero() {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPlay(!media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <section id="top" className="relative flex min-h-svh items-end">
      <Image
        src={photos.winter.src}
        alt={photos.winter.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {play ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={photos.winter.src}
          aria-hidden="true"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
      ) : null}
      <div className="steam" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-bark/80 via-bark/25 to-bark/30" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-32 md:pb-24">
        <p className="text-xs uppercase tracking-[0.22em] text-cream/80">The Loony'Bin · Lake Minnewawa</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-bark/70 px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-amber">
          New this season
          <span className="text-cream/85">Hot tub</span>
        </p>
        <h1 className="mt-6 max-w-4xl font-serif text-[clamp(3.1rem,8vw,6.6rem)] leading-[0.9] tracking-[-0.035em] text-cream">
          A cozy stay on a quiet peninsula.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/90">
          Shorefront on the point at Lake Minnewawa, near McGregor. The hot tub is in. The dock is out until summer.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#book" className="rounded-full bg-amber px-5 py-3 text-sm font-medium text-bark">
            Check dates
          </a>
          <a href="#stay" className="rounded-full border border-cream/50 px-5 py-3 text-sm text-cream">
            See the cabin
          </a>
        </div>
      </div>
    </section>
  );
}
