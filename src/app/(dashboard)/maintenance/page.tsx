// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';

import MaintenanceClient from "./maintenance-client";

export default function Page() {
  return <MaintenanceClient />;
}

    