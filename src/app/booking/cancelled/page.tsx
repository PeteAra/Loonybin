import { BrandLink } from "@/components/LoonMark";

export default function CancelledPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <BrandLink />
      <h1 className="mt-8 font-serif text-5xl">No charge.</h1>
      <p className="mt-4 text-lg text-bark/80">
        The payment page was closed. If the hold is still open, the same payment link will work. Otherwise the nights go back on the calendar.
      </p>
      <a href="/#book" className="mt-8 inline-block text-sm underline">Return to the calendar</a>
    </main>
  );
}
