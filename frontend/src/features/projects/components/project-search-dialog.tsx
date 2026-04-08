"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { FolderKanban, RefreshCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { getProjectPath } from "@/features/projects/lib/project-paths";
import { filterProjectSearchResults } from "@/features/projects/lib/filter-project-search-results";
import { getProjectInitials } from "@/features/projects/lib/project-summary";

type ProjectSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectSearchDialog({
  open,
  onOpenChange,
}: ProjectSearchDialogProps) {
  const router = useRouter();
  const projectsQuery = useProjects();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const projectItems = projectsQuery.data?.items;
  const filteredProjects = useMemo(
    () => filterProjectSearchResults(projectItems ?? [], deferredQuery),
    [deferredQuery, projectItems],
  );

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setQuery("");
    }
  }

  function handleProjectSelect(projectId: string) {
    handleOpenChange(false);
    startTransition(() => {
      router.push(getProjectPath(projectId) as Route);
    });
  }

  const hasProjects = (projectItems?.length ?? 0) > 0;
  const hasQuery = deferredQuery.trim().length > 0;
  const showNoResults =
    !projectsQuery.isPending &&
    !projectsQuery.isError &&
    hasProjects &&
    filteredProjects.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl border-border/80 bg-card/98 p-0 shadow-[0_32px_80px_-34px_rgba(15,23,42,0.52)]">
        <DialogHeader className="border-b border-border/70 px-5 pt-5 pb-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[1rem] border border-border/80 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_5%,white),color-mix(in_oklab,var(--background)_94%,white))] text-primary shadow-[0_18px_28px_-24px_rgba(15,23,42,0.42)]">
              <Search className="size-4" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>Search projects</DialogTitle>
                <Badge variant="outline" size="xs">
                  Visible workspace
                </Badge>
              </div>
              <DialogDescription>
                Find a visible project by name or description and jump straight into
                its board.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
          <div className="space-y-2">
            <label
              htmlFor="project-search-input"
              className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            >
              Project finder
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                id="project-search-input"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search project name or description"
                className="h-11 rounded-[1rem] border-border/80 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_3%,white),color-mix(in_oklab,var(--background)_95%,white))] pr-3 pl-10 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_34px_-30px_rgba(15,23,42,0.36)]"
              />
            </div>
          </div>

          <div className="max-h-[22rem] overflow-y-auto pr-1">
            {projectsQuery.isPending ? (
              <SearchState
                title="Loading visible projects"
                description="The workspace list is syncing so search can use the latest project names."
              />
            ) : null}

            {projectsQuery.isError ? (
              <SearchState
                title="Projects unavailable"
                description="Retry to reconnect the workspace project list before searching."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => void projectsQuery.refetch()}
                  >
                    <RefreshCcw className="size-4" />
                    Retry loading projects
                  </Button>
                }
              />
            ) : null}

            {!projectsQuery.isPending && !projectsQuery.isError && !hasProjects ? (
              <SearchState
                title="No visible projects yet"
                description="Create the first project from the dashboard and it will appear here automatically."
              />
            ) : null}

            {showNoResults ? (
              <SearchState
                title="No matching projects"
                description={
                  hasQuery
                    ? `No visible project matches "${deferredQuery.trim()}".`
                    : "Try another project name or a keyword from the description."
                }
              />
            ) : null}

            {!projectsQuery.isPending &&
            !projectsQuery.isError &&
            filteredProjects.length > 0 ? (
              <div className="space-y-2" role="list" aria-label="Project search results">
                {filteredProjects.map((project) => {
                  const description =
                    project.description?.trim() ||
                    "No description yet. Open the board to define the next move.";

                  return (
                    <div key={project.id} role="listitem">
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 rounded-[1rem] border border-border/80 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_3%,white),color-mix(in_oklab,var(--background)_96%,white))] px-3 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_28px_-30px_rgba(15,23,42,0.32)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_20px_32px_-28px_rgba(15,23,42,0.4)] focus-visible:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:outline-none"
                        onClick={() => handleProjectSelect(project.id)}
                      >
                        <div className="grid size-10 shrink-0 place-items-center rounded-[0.95rem] border border-border/70 bg-background/85 text-xs font-semibold text-foreground shadow-[0_12px_20px_-18px_rgba(15,23,42,0.35)]">
                          {getProjectInitials(project.name)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {project.name}
                            </p>
                            <Badge
                              variant={project.role === "OWNER" ? "default" : "muted"}
                              size="xs"
                            >
                              {project.role === "OWNER" ? "Owner" : "Member"}
                            </Badge>
                          </div>
                          <p className="text-sm leading-5 text-muted-foreground">
                            {description}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchState({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-[1rem] border border-border/80 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_3%,white),color-mix(in_oklab,var(--surface-subtle)_96%,white))] px-4 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-[0.95rem] border border-border/70 bg-background/90 text-muted-foreground">
          <FolderKanban className="size-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          {action ? <div className="pt-2">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
