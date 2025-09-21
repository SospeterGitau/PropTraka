// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';   // <-- now it takes effect
export const revalidate = 0;              // extra safety: never prerender/cache
export const fetchCache = 'force-no-store';

import ArrearsClient from "./ArrearsClient";

export default function Page() {
  return <ArrearsClient />;
}
