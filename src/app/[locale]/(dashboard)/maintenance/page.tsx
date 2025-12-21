import { getProperties } from "@/lib/data/properties";
import { getMaintenanceRequests } from "@/lib/data/maintenance";
import MaintenanceClient from "./maintenance-client";

export default async function Page() {
  const [properties, requests] = await Promise.all([
    getProperties(),
    getMaintenanceRequests(),
  ]);

  return <MaintenanceClient maintenanceRequests={requests} properties={properties} />;
}
