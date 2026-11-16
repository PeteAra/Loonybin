import Image from "next/image";
import { photos } from "@/content/photos";

export function Morning() {
  return (
    <section className="grid bg-paper md:grid-cols-2" aria-label="Mornings on the deck">
      <div className="relative min-h-[70vh]">
        <Image src={photos.morning.src} alt={photos.morning.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="flex items-center px-6 py-16 md:px-16">
        <div className="max-w-md">
          <p className="text-xs uppercase tracking-[0.22em] text-moss">Mornings</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight md:text-6xl">Breakfast on the deck, the lake still flat.</h2>
          <p className="mt-5 text-lg leading-relaxed text-bark/80">The loon glass stays out here. So do the chairs, pointed at the water.</p>
        </div>
      </div>
    </section>
  );
}
