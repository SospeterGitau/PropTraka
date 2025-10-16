// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';

import PropertiesClient from "./properties-client";

export default function Page() {
  return <PropertiesClient />;
}
