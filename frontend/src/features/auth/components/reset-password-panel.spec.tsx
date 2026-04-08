import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showSuccessToast } from "@/lib/toast";
import { ResetPasswordPanel } from "@/features/auth/components/reset-password-panel";

const replaceMock = vi.hoisted(() => vi.fn());
const resetTokenForSpec = vi.hoisted(() => "reset-token-for-spec");
const nextPasswordForSpec = "PasswordForSpec1";
const searchParamsState = vi.hoisted(
  () =>
    new URLSearchParams(
      `token=${resetTokenForSpec}&email=jane@example.com`,
    ),
);
const useResetPasswordMock = vi.hoisted(() => vi.fn());
const showApiErrorToastMock = vi.hoisted(() => vi.fn());
const showSuccessToastMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => searchParamsState,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/auth/hooks/use-reset-password", () => ({
  useResetPassword: useResetPasswordMock,
}));

vi.mock("@/lib/toast", () => ({
  showApiErrorToast: showApiErrorToastMock,
  showSuccessToast: showSuccessToastMock,
}));

describe("ResetPasswordPanel", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    showApiErrorToastMock.mockReset();
    showSuccessToastMock.mockReset();
    searchParamsState.set("token", resetTokenForSpec);
    searchParamsState.set("email", "jane@example.com");
    useResetPasswordMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({
        message:
          "Password reset successfully. Please log in with your new password.",
        email: "jane@example.com",
      }),
    });
  });

  it("resets the password and routes back to login with the email prefilled", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      message:
        "Password reset successfully. Please log in with your new password.",
      email: "jane@example.com",
    });
    useResetPasswordMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    });

    render(<ResetPasswordPanel />);

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: nextPasswordForSpec },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: nextPasswordForSpec },
    });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        token: resetTokenForSpec,
        password: nextPasswordForSpec,
      });
    });

    expect(showSuccessToast).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith(
      "/login?email=jane%40example.com",
    );
  });

  it("shows the fallback state when the reset token is missing", () => {
    searchParamsState.delete("token");

    render(<ResetPasswordPanel />);

    expect(
      screen.getByRole("heading", { name: /reset link unavailable/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to forgot password/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });
});
