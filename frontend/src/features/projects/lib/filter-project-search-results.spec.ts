import { describe, expect, it } from "vitest";
import type { ProjectSummary } from "@/contracts/projects";
import { filterProjectSearchResults } from "@/features/projects/lib/filter-project-search-results";

describe("filterProjectSearchResults", () => {
  it("returns all projects sorted by name when the query is blank", () => {
    expect(
      filterProjectSearchResults(
        [createProject("beta", "Beta launch"), createProject("alpha", "Alpha ops")],
        "   ",
      ).map((project) => project.name),
    ).toEqual(["alpha", "beta"]);
  });

  it("matches project names case-insensitively", () => {
    expect(
      filterProjectSearchResults(
        [createProject("Alpha board", "Ops"), createProject("Beta board", "QA")],
        "alpha",
      ).map((project) => project.name),
    ).toEqual(["Alpha board"]);
  });

  it("matches project descriptions", () => {
    expect(
      filterProjectSearchResults(
        [
          createProject("Client launch", "Coordinate marketing handoff"),
          createProject("QA readiness", "Track smoke testing"),
        ],
        "handoff",
      ).map((project) => project.name),
    ).toEqual(["Client launch"]);
  });

  it("returns no results when nothing matches", () => {
    expect(
      filterProjectSearchResults(
        [createProject("Client launch", "Coordinate marketing handoff")],
        "finance",
      ),
    ).toEqual([]);
  });
});

function createProject(
  name: string,
  description: string | null,
): ProjectSummary {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    description,
    role: "OWNER",
    statuses: [],
  };
}
