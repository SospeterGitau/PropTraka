"use server";

import { generateSmartAlerts, type GenerateSmartAlertsOutput } from "@/ai/flows/generate-smart-alerts";
import { dashboardData, weatherData, calendarEvents } from "@/lib/data";

export async function getSmartAlerts(): Promise<GenerateSmartAlertsOutput> {
  try {
    const alerts = await generateSmartAlerts({
      dashboardData: JSON.stringify(dashboardData),
      weatherData: JSON.stringify(weatherData),
      calendarEvents: JSON.stringify(calendarEvents),
    });
    return alerts;
  } catch (error) {
    console.error("Error generating smart alerts:", error);
    // Return a structured error if you want to handle it on the client
    return {
      alerts: [
        {
          message: "Failed to generate smart alerts. Please try again later.",
          severity: "high",
          propertyAddress: "System",
        },
      ],
    };
  }
}
