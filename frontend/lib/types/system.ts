export type ServiceState = "ok" | "missing" | "configured" | "unconfigured" | "misconfigured" | "error" | "degraded";

export interface HealthCheckItem {
  status: ServiceState;
  detail?: string;
  missing?: string[];
  backend?: string;
  durable?: boolean;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  version: string;
  environment: string;
  checks: {
    env: HealthCheckItem;
    anthropic: HealthCheckItem;
    x: HealthCheckItem;
    supabase: HealthCheckItem;
    redis: HealthCheckItem;
    approval_store?: HealthCheckItem;
  };
  warnings: string[];
}

export interface ConfigStatusResponse {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  services: {
    anthropic: boolean;
    supabase: boolean;
    x_api: boolean;
    redis: boolean;
  };
  approval_store?: {
    backend: string;
    durable: boolean;
    status: ServiceState;
    detail: string;
  };
  cors_origins: string[];
  warnings: string[];
  validation_errors: string[];
}
