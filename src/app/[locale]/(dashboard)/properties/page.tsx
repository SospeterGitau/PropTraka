import { PropertiesClient } from "./properties-client";
import { getProperties } from "@/lib/data/properties";

export default async function Page() {
  const properties = await getProperties();
  return <PropertiesClient initialProperties={properties} />;
}
