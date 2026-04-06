import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerifyEmailPage from "./page";

const emailVerificationPanelMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/components/email-verification-panel", () => ({
  EmailVerificationPanel: emailVerificationPanelMock,
}));

describe("VerifyEmailPage", () => {
  const tokenField = "token";

  beforeEach(() => {
    emailVerificationPanelMock.mockReset();
    emailVerificationPanelMock.mockImplementation(
      ({ email, token, nextPath }: { email: string | null; token: string | null; nextPath: string }) => (
        <div>
          <span>{email ?? "no-email"}</span>
          <span>{token ?? "no-token"}</span>
          <span>{nextPath}</span>
        </div>
      ),
    );
  });

  it("passes normalized email, token, and next path into the verification panel", async () => {
    render(
      await VerifyEmailPage({
        searchParams: Promise.resolve({
          email: "  Jane@Example.com  ",
          [tokenField]: " verify-token ",
          next: "/app/projects/project-1",
        }),
      }),
    );

    expect(screen.getByText("Jane@Example.com")).toBeInTheDocument();
    expect(screen.getByText("verify-token")).toBeInTheDocument();
    expect(screen.getByText("/app/projects/project-1")).toBeInTheDocument();
  });

  it("falls back to the app dashboard when no next path is provided", async () => {
    render(
      await VerifyEmailPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByText("no-email")).toBeInTheDocument();
    expect(screen.getByText("no-token")).toBeInTheDocument();
    expect(screen.getByText("/app")).toBeInTheDocument();
  });
});
