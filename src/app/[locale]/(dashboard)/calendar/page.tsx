import CalendarClient from "./calendar-client";
import { getProperties } from "@/lib/data/properties";
import { getRevenue, getExpenses } from "@/lib/data/finance";
import { getTenancies } from "@/lib/data/tenancies";
import { getMaintenanceRequests } from "@/lib/data/maintenance";

export default async function Page() {
    const [properties, revenue, expenses, tenancies, maintenanceRequests] = await Promise.all([
        getProperties(),
        getRevenue(),
        getExpenses(),
        getTenancies(),
        getMaintenanceRequests(),
    ]);

    return (
        <CalendarClient
            initialProperties={properties}
            initialRevenue={revenue}
            initialExpenses={expenses}
            initialTenancies={tenancies}
            initialMaintenanceRequests={maintenanceRequests}
        />
    );
}
