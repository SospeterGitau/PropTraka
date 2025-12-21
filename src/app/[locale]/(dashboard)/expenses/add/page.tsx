import AddExpenseClient from "./add-expense-client";
import { getProperties } from "@/lib/data/properties";
import { getContractors } from "@/lib/data/maintenance";

export default async function Page() {
    const [properties, contractors] = await Promise.all([
        getProperties(),
        getContractors(),
    ]);

    return (
        <AddExpenseClient
            initialProperties={properties}
            initialContractors={contractors}
        />
    );
}
