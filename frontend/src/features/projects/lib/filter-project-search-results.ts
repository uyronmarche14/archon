import type { ProjectSummary } from "@/contracts/projects";
import { sortProjectsByName } from "@/features/projects/lib/project-summary";

export function filterProjectSearchResults(
  projects: ProjectSummary[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const sortedProjects = sortProjectsByName(projects);

  if (normalizedQuery.length === 0) {
    return sortedProjects;
  }

  return sortedProjects.filter((project) => {
    const searchableText = [project.name, project.description ?? ""]
      .join(" ")
      .trim()
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}
