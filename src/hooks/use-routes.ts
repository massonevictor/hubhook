import { useQuery } from "@tanstack/react-query";
import { api, WebhookRoute } from "@/lib/api";

export const ROUTES_QUERY_KEY = ["routes"] as const;

export function useRoutes() {
  return useQuery<WebhookRoute[]>({
    queryKey: ROUTES_QUERY_KEY,
    queryFn: api.getRoutes,
  });
}
