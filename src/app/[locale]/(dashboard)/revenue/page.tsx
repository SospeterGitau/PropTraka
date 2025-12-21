import { getRevenue } from "@/lib/data/finance";
import { getTenancies } from "@/lib/data/tenancies";
import RevenueClient from "./revenue-client";

export default async function Page() {
  const [revenue, tenancies] = await Promise.all([
    getRevenue(),
    getTenancies(),
  ]);

  return <RevenueClient initialRevenue={revenue as any} initialTenancies={tenancies} />;
}
