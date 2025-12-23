import TenantsClient from "./tenants-client";
import { getTenants } from "@/lib/data/tenants";

export default async function Page() {
    const tenants = await getTenants();
    return <TenantsClient initialTenants={tenants} />;
}
