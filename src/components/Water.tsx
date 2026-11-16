import Image from "next/image";
import { photos } from "@/content/photos";

export function Water() {
  return (
    <section id="water" className="section-anchor bg-green text-cream">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="px-5 py-16 md:px-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.22em] text-amber">When the dock is in</p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight md:text-6xl">The water gear waits until summer.</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/85">
            The dock is pulled for the winter. It goes back in with the warm weather, and the kayaks and paddleboards come with it.
          </p>
          <ul className="mt-8 max-w-lg divide-y divide-cream/20 border-y border-cream/20">
            <li className="py-4">
              <span className="block font-serif text-2xl">Dock</span>
              <span className="text-cream/75">Pulled for the winter.</span>
            </li>
            <li className="py-4">
              <span className="block font-serif text-2xl">Kayaks and paddleboards</span>
              <span className="text-cream/75">Free for guests, on a rack at the shoreline, back when the dock is in.</span>
            </li>
          </ul>
          <article className="relative mt-10 max-w-lg border border-cream/30 p-6">
            <div className="absolute -right-2 -top-8 stamp text-amber" aria-hidden="true">
              Moored until summer
            </div>
            <h3 className="font-serif text-3xl">Pontoon rental</h3>
            <p className="mt-3 max-w-sm text-cream/80">
              The boat is a summer add-on, and this season it stays put. Reservations will open on this page when it is back in the water.
            </p>
            <figure className="mt-6">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={photos.pontoon.src} alt={photos.pontoon.alt} fill sizes="30rem" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-sm text-cream/70">The pontoon, back when the lake is open.</figcaption>
            </figure>
          </article>
        </div>
        <div className="relative min-h-[55vh]">
          <Image src={photos.shore.src} alt={photos.shore.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover saturate-[.72]" />
          <div className="absolute inset-0 bg-green/25" />
        </div>
      </div>
    </section>
  );
}
