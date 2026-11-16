"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { photos } from "@/content/photos";

const lines = [
  "The end of the peninsula, after the trees thin out.",
  "A new hot tub on the deck. Steam over a still lake.",
  "Pick your nights. We confirm, then you pay.",
];

const frames = [
  { photo: photos.autumn, position: "object-center" },
  { photo: photos.dusk, position: "object-[22%_center]" },
  { photo: photos.bedroom, position: "object-[24%_center]" },
];

export function HotTubStory() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      node.dataset.reduce = "true";
      return;
    }

    let cancelled = false;
    let revert: (() => void) | undefined;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        const items = gsap.utils.toArray<HTMLElement>(".story-line");
        const pictures = gsap.utils.toArray<HTMLElement>(".story-frame");
        gsap.set(items, { autoAlpha: 0, y: 28 });
        gsap.set(items[0], { autoAlpha: 1, y: 0 });
        gsap.set(pictures, { autoAlpha: 0 });
        gsap.set(pictures[0], { autoAlpha: 1 });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=160%",
              pin: true,
              scrub: 0.55,
              anticipatePin: 1,
            },
          })
          .to(items[0], { autoAlpha: 0, y: -24, duration: 0.35 })
          .to(pictures[1], { autoAlpha: 1, duration: 0.7 }, "<")
          .to(items[1], { autoAlpha: 1, y: 0, duration: 0.35 })
          .to(items[1], { autoAlpha: 0, y: -24, duration: 0.35 }, "+=0.25")
          .to(pictures[2], { autoAlpha: 1, duration: 0.75 }, "<")
          .to(items[2], { autoAlpha: 1, y: 0, duration: 0.4 });
      }, root);
      revert = () => context.revert();
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <section ref={root} className="hot-tub-story relative h-svh overflow-hidden bg-bark" aria-label="The new hot tub">
      <div className="absolute inset-0 z-0">
        {frames.map(({ photo, position }, index) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt=""
            fill
            sizes="100vw"
            className={`story-frame object-cover ${position} ${index === 0 ? "opacity-100" : "opacity-0"}`}
            style={{ zIndex: index }}
          />
        ))}
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-bark/85 via-bark/20 to-bark/25" />
      <div className="relative z-10 flex h-full items-end">
        <div className="mx-auto w-full max-w-6xl px-5 pb-16 md:pb-24">
          <p className="text-xs uppercase tracking-[0.22em] text-amber">New this season</p>
          <div className="relative mt-4 min-h-36 max-w-3xl md:min-h-44">
            {lines.map((line) => (
              <p key={line} className="story-line absolute inset-x-0 top-0 font-serif text-4xl leading-tight text-cream md:text-6xl">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
