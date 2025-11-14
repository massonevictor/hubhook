function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return normalizeBaseUrl(window.location.origin);
  }

  return "https://api.hubhook.nerddomarketing.com.br";
}

const API_BASE_URL = getApiBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
    body: options?.body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface DashboardSummary {
  totalWebhooks: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  chart: Array<{ date: string; total: number; success: number; failed: number }>;
  projects: number;
  activeRoutes: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string | null;
  routes: number;
  webhookCount: number;
  successRate: number;
}

export type WebhookStatus = "PENDING" | "SUCCESS" | "FAILED" | "RETRYING";

export interface WebhookListItem {
  id: string;
  name: string;
  project: string;
  status: WebhookStatus;
  attempts: number;
  timestamp: string;
  routeId: string;
  slug: string;
  destinationCount: number;
  deliveredCount: number;
}

export interface DestinationInput {
  id?: string;
  label: string;
  endpoint: string;
  priority: number;
  isActive?: boolean;
}

export interface WebhookDestination extends DestinationInput {
  id: string;
  isActive: boolean;
}

export interface WebhookRoute {
  id: string;
  name: string;
  slug: string;
  inboundUrl: string;
  secret: string;
  retentionDays: number;
  maxRetries: number;
  isActive: boolean;
  project: {
    id: string;
    name: string;
  };
  webhookCount: number;
  destinations: WebhookDestination[];
}

export interface CreateRoutePayload {
  name: string;
  projectId: string;
  retentionDays: number;
  maxRetries: number;
  destinations: Array<Omit<DestinationInput, "id">>;
}

export interface UpdateRoutePayload {
  name?: string;
  retentionDays?: number;
  maxRetries?: number;
  isActive?: boolean;
  destinations?: DestinationInput[];
}

export interface EventAttempt {
  id: string;
  success: boolean;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  createdAt: string;
  destination: {
    id: string;
    label: string;
    endpoint: string;
  } | null;
}

export interface EventDetails {
  id: string;
  status: WebhookStatus;
  timestamp: string;
  lastAttemptAt: string | null;
  payload: unknown;
  headers: Record<string, string>;
  attemptCount: number;
  destinationCount: number;
  deliveredCount: number;
  errorMessage?: string | null;
  route: WebhookRoute;
  attempts: EventAttempt[];
}

export const api = {
  getDashboardSummary: () => request<DashboardSummary>("/api/stats/summary"),
  getProjects: () => request<ProjectSummary[]>("/api/projects"),
  getRoutes: () => request<WebhookRoute[]>("/api/routes"),
  getRoute: (id: string) => request<WebhookRoute>(`/api/routes/${id}`),
  updateRoute: (id: string, payload: UpdateRoutePayload) =>
    request<WebhookRoute>(`/api/routes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getWebhooks: (search?: string) => request<WebhookListItem[]>(`/api/webhooks${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getEventDetails: (id: string) => request<EventDetails>(`/api/events/${id}`),
  retryEvent: (id: string) =>
    request<{ status: string }>(`/api/events/${id}/retry`, {
      method: "POST",
    }),
  createWebhookRoute: (payload: CreateRoutePayload) =>
    request<WebhookRoute>("/api/routes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
