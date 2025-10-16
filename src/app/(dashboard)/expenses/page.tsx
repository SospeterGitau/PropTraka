// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';

import ExpensesClient from "./expenses-client";

export default function Page() {
  return <ExpensesClient />;
}
