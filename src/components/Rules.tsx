import { cabin } from "@/content/cabin";

export function Rules() {
  return (
    <section id="rules" className="section-anchor bg-cream px-5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl border border-dashed border-bark/30 bg-paper p-6 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-deep">Placeholder</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl">Rules and fees</h2>
        <ul className="mt-6 space-y-3 text-bark/80">
          {cabin.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-bark/70">
          Sample times: check-in {cabin.stay.checkIn}, check-out {cabin.stay.checkOut}. The host will replace these, along with the real fees, before launch.
        </p>
      </div>
    </section>
  );
}
