import { isHost } from "@/lib/auth";
import { getOverview } from "@/lib/bookings";
import { HostDashboard } from "@/components/HostDashboard";
import { HostLogin } from "@/components/HostLogin";

export const dynamic = "force-dynamic";

export default async function HostPage() {
  if (!(await isHost())) return <HostLogin showDevHint={!process.env.HOST_PASSWORD && process.env.NODE_ENV !== "production"} />;
  const overview = await getOverview();
  return <HostDashboard initial={overview} />;
}
