// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';

import ReportsClient from "./reports-client";

export default function Page() {
  return <ReportsClient />;
}
