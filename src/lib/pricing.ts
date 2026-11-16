import { cabin } from "@/content/cabin";
import { nightsBetween } from "@/lib/dates";

export type Quote = {
  nights: number;
  nightlyCents: number;
  cleaningCents: number;
  taxCents: number;
  totalCents: number;
  placeholder: boolean;
};

export function quoteStay(checkIn: string, checkOut: string): Quote {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) throw new Error("Choose a checkout date after check-in.");
  if (nights < cabin.stay.minNights) {
    throw new Error(`Minimum stay is ${cabin.stay.minNights} nights.`);
  }
  if (nights > 60) throw new Error("For a stay longer than 60 nights, write the host directly.");
  const nightlyCents = Math.round(cabin.pricing.nightlyRate * 100);
  const cleaningCents = Math.round(cabin.pricing.cleaningFee * 100);
  const beforeTax = nightlyCents * nights + cleaningCents;
  const taxCents = Math.round(beforeTax * cabin.pricing.taxRate);
  return {
    nights,
    nightlyCents,
    cleaningCents,
    taxCents,
    totalCents: beforeTax + taxCents,
    placeholder: cabin.pricing.placeholder,
  };
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
