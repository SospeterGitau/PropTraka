import DashboardClient from "./dashboard-client";
import { getProperties } from "@/lib/data/properties";
import { getRevenue, getExpenses } from "@/lib/data/finance";

export default async function Page() {
    const [properties, revenue, expenses] = await Promise.all([
        getProperties(),
        getRevenue(),
        getExpenses(),
    ]);

    return (
        <DashboardClient
            initialProperties={properties}
            initialRevenue={revenue}
            initialExpenses={expenses}
        />
    );
}
