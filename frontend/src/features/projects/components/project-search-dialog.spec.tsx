import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectSearchDialog } from "@/features/projects/components/project-search-dialog";

const routerState = vi.hoisted(() => ({
  push: vi.fn(),
}));

const projectsHookState = vi.hoisted(() => ({
  useProjects: vi.fn(),
}));

vi.mock("lucide-react", () => {
  const Icon = () => null;

  return {
    FolderKanban: Icon,
    RefreshCcw: Icon,
    Search: Icon,
    X: Icon,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerState,
}));

vi.mock("@/features/projects/hooks/use-projects", () => projectsHookState);

describe("ProjectSearchDialog", () => {
  beforeEach(() => {
    routerState.push.mockReset();
    projectsHookState.useProjects.mockReset();
    projectsHookState.useProjects.mockReturnValue({
      data: {
        items: [
          createProjectSummary("project-2", "QA readiness", {
            description: "Track smoke testing and release signoff.",
            role: "MEMBER",
          }),
          createProjectSummary("project-1", "Launch planning", {
            description: "Coordinate the go-live checklist across teams.",
            role: "OWNER",
          }),
        ],
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders sorted results and filters by name and description", () => {
    render(<ControlledProjectSearchDialog />);

    const results = screen.getAllByRole("listitem");
    expect(results[0]).toHaveTextContent("Launch planning");
    expect(results[1]).toHaveTextContent("QA readiness");

    fireEvent.change(screen.getByLabelText(/project finder/i), {
      target: { value: "smoke" },
    });

    expect(screen.getByRole("listitem")).toHaveTextContent("QA readiness");
    expect(screen.queryByText("Launch planning")).not.toBeInTheDocument();
  });

  it("shows a loading state while the workspace list is syncing", () => {
    projectsHookState.useProjects.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ControlledProjectSearchDialog />);

    expect(screen.getByText(/loading visible projects/i)).toBeInTheDocument();
  });

  it("shows a retry state when projects fail to load", () => {
    const refetch = vi.fn();

    projectsHookState.useProjects.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    });

    render(<ControlledProjectSearchDialog />);

    fireEvent.click(screen.getByRole("button", { name: /retry loading projects/i }));

    expect(refetch).toHaveBeenCalled();
  });

  it("shows an empty state when there are no visible projects", () => {
    projectsHookState.useProjects.mockReturnValue({
      data: {
        items: [],
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ControlledProjectSearchDialog />);

    expect(screen.getByText(/no visible projects yet/i)).toBeInTheDocument();
  });

  it("shows a no-results state when the query does not match anything", () => {
    render(<ControlledProjectSearchDialog />);

    fireEvent.change(screen.getByLabelText(/project finder/i), {
      target: { value: "finance" },
    });

    expect(screen.getByText(/no matching projects/i)).toBeInTheDocument();
  });

  it("navigates and closes when a result is selected", () => {
    render(<ControlledProjectSearchDialog />);

    fireEvent.click(screen.getByRole("button", { name: /launch planning owner/i }));

    expect(routerState.push).toHaveBeenCalledWith("/app/projects/project-1");
    expect(
      screen.queryByRole("heading", { name: /search projects/i }),
    ).not.toBeInTheDocument();
  });
});

function ControlledProjectSearchDialog() {
  const [open, setOpen] = useState(true);

  return <ProjectSearchDialog open={open} onOpenChange={setOpen} />;
}

function createProjectSummary(
  id: string,
  name: string,
  options: {
    description?: string | null;
    role: "OWNER" | "MEMBER";
  },
) {
  return {
    id,
    name,
    description: options.description ?? null,
    role: options.role,
    statuses: [],
  };
}
