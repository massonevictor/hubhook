import { useQuery } from "@tanstack/react-query";
import { api, WebhookListItem } from "@/lib/api";

export function useWebhooks(search: string) {
  return useQuery<WebhookListItem[]>({
    queryKey: ["webhooks", search],
    queryFn: () => api.getWebhooks(search || undefined),
  });
}
