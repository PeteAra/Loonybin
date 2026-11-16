import Image from "next/image";
import { cabin } from "@/content/cabin";
import { photos } from "@/content/photos";

const gallery = [photos.exterior, photos.dining, photos.kitchen, photos.bath, photos.bedroomDetail, photos.porchQuiet, photos.winter];

export function Stay() {
  return (
    <section id="stay" className="section-anchor bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-moss">The stay</p>
          <h2 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">At the end of the peninsula.</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed">
            The Loony'Bin sits shorefront on Lake Minnewawa, where the point runs out near McGregor. Fall leaves, a screened porch, and a fire pit between the cabin and the water.
          </p>
        </div>
        <dl className="divide-y divide-bark/15 border-y border-bark/15">
          {cabin.beds.map((bed) => (
            <div key={bed.place} className="py-4">
              <dt className="font-serif text-2xl">{bed.place}</dt>
              <dd className="mt-1 text-bark/75">{bed.detail}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-green text-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-amber">The hot tub</p>
            <h3 className="mt-3 max-w-xl font-serif text-4xl leading-tight md:text-5xl">This season, the deck is the reason to come.</h3>
          </div>
          <p className="max-w-sm text-cream/80">After the lake goes quiet, the water stays hot. Soak with the trees around the point.</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 py-12 md:grid-cols-12 md:gap-4 md:py-16">
        {gallery.map((photo, index) => {
          const last = index === gallery.length - 1;
          const frame = last
            ? "col-span-2 md:col-span-12"
            : index === 0
              ? "col-span-2 md:col-span-7"
              : "col-span-1 md:col-span-5";
          const aspect = last
            ? "aspect-[4/5] md:aspect-[2/1]"
            : index === 0
              ? "aspect-[4/5] md:aspect-[4/3]"
              : "aspect-[3/4] md:aspect-[4/5]";
          return (
            <figure key={photo.src} className={frame}>
              <div className={`relative overflow-hidden ${aspect}`}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={last ? "(min-width: 768px) 70vw, 100vw" : "(min-width: 768px) 40vw, 90vw"}
                  className={last ? "object-cover object-[center_68%]" : "object-cover"}
                />
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
