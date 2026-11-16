export const cabin = {
  name: "The Loony'Bin",
  lake: "Lake Minnewawa",
  near: "McGregor, Minnesota",
  maxGuests: 4,
  airbnbUrl: "",
  stay: {
    minNights: 2,
    checkIn: "4:00 p.m.",
    checkOut: "10:00 a.m.",
    timesArePlaceholder: true,
  },
  pricing: {
    placeholder: true,
    nightlyRate: 275,
    cleaningFee: 125,
    taxRate: 0.06875,
  },
  rules: [
    "Placeholder. Quiet hours and the rental agreement will be listed here.",
    "Placeholder. Parking, pets, and smoking rules will be listed here.",
    "Placeholder. Any extra fees will be listed here before anyone is asked to pay.",
  ],
  beds: [
    { place: "The loft", detail: "Two full beds under the wood eaves." },
    { place: "The bedroom", detail: "A queen, green beadboard, and a window toward the trees." },
    { place: "The living room", detail: "A fold-out couch for whoever claims it." },
  ],
} as const;
