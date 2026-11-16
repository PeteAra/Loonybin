import Image from "next/image";
import { photos } from "@/content/photos";

const frames = [
  { photo: photos.porch, caption: "Screened porch" },
  { photo: photos.summer, caption: "Summer on the deck" },
  { photo: photos.loft, caption: "The loft" },
  { photo: photos.bedroom, caption: "The bedroom" },
];

export function FilmStrip() {
  return (
    <section className="film-section bg-cream py-16 md:py-24" aria-label="Cabin photos">
      <div className="mb-8 px-[6vw]">
        <p className="text-xs uppercase tracking-[0.22em] text-moss">The cabin</p>
        <h2 className="mt-2 max-w-xl font-serif text-4xl leading-none tracking-tight md:text-6xl">Porch, summer, loft.</h2>
      </div>
      <div className="film-viewport">
        <div className="film-track">
          {frames.map((frame) => (
            <figure key={frame.caption} className="w-[min(78vw,26rem)] shrink-0">
              <div className="relative h-[62vh] overflow-hidden">
                <Image src={frame.photo.src} alt={frame.photo.alt} fill sizes="26rem" className="object-cover" />
              </div>
              <figcaption className="mt-3 font-serif text-2xl">{frame.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
