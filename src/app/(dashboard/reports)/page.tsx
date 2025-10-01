// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';

import ReportsClient from "./ReportsClient.tsx";

export default function Page() {
  return <ReportsClient />;
}
