import { useQuery } from "@tanstack/react-query";
import { api, EventDetails } from "@/lib/api";

export function useEventDetails(eventId: string | null) {
  return useQuery<EventDetails | null>({
    queryKey: ["event", eventId],
    queryFn: () => (eventId ? api.getEventDetails(eventId) : Promise.resolve(null)),
    enabled: Boolean(eventId),
  });
}
