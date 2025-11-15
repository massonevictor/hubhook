import { useQuery } from "@tanstack/react-query";
import { api, WebhookListItem, WebhookStatus } from "@/lib/api";

export function useWebhooks(params: { search?: string; status?: WebhookStatus }) {
  const { search, status } = params;
  return useQuery<WebhookListItem[]>({
    queryKey: ["webhooks", search ?? "", status ?? ""],
    queryFn: () => api.getWebhooks(params),
  });
}
