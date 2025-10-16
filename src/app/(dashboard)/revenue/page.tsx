// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';

import RevenueClient from "./revenue-client";

export default function Page() {
  return <RevenueClient />;
}
