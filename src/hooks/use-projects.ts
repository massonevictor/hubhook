import { useQuery } from "@tanstack/react-query";
import { api, ProjectSummary } from "@/lib/api";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: api.getProjects,
  });
}
