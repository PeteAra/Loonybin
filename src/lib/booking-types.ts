export type BookingStatus = "pending" | "approved" | "paid" | "declined" | "expired";

export type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: BookingStatus;
  amountCents: number | null;
  stripeSessionId: string | null;
  paymentUrl: string | null;
  holdExpiresAt: string | null;
  createdAt: string;
};

export type DateBlock = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
};
