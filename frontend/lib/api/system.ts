import { getApiUrl } from "../config";
import { ConfigStatusResponse, HealthResponse } from "../types/system";

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(getApiUrl("/health"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function fetchConfigStatus(): Promise<ConfigStatusResponse> {
  const res = await fetch(getApiUrl("/config/status"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Config status failed: ${res.status}`);
  return res.json();
}
