import ExpensesClient from "./expenses-client";
import { getExpenses } from "@/lib/data/finance";

export default async function Page() {
  const expenses = await getExpenses();
  return <ExpensesClient initialExpenses={expenses} />;
}
