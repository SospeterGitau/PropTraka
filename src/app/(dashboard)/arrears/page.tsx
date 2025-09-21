// Server file: this is where Next will actually read the route options.
export const dynamic = 'force-dynamic';

import ArrearsClient from "./ArrearsClient";

export default function Page() {
  return <ArrearsClient />;
}
