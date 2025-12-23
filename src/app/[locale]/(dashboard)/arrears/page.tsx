import ArrearsClient from "./arrears-client";
import { getRevenue } from "@/lib/data/finance";
import { getTenancies } from "@/lib/data/tenancies";
import { getProperties } from "@/lib/data/properties";
import { getTenants } from "@/lib/data/tenants";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [revenue, tenancies, properties, tenants] = await Promise.all([
    getRevenue(),
    getTenancies(),
    getProperties(),
    getTenants(),
  ]);

  return <ArrearsClient
    initialRevenue={revenue}
    initialTenancies={tenancies}
    initialProperties={properties}
    initialTenants={tenants}
  />;
}
