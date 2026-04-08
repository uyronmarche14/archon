import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/services/http/api-client-error";
import { ForgotPasswordPanel } from "@/features/auth/components/forgot-password-panel";

const searchParamsState = vi.hoisted(
  () => new URLSearchParams("email=jane@example.com"),
);
const useForgotPasswordMock = vi.hoisted(() => vi.fn());
const showApiErrorToastMock = vi.hoisted(() => vi.fn());
const showSuccessToastMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
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

vi.mock("@/features/auth/hooks/use-forgot-password", () => ({
  useForgotPassword: useForgotPasswordMock,
}));

vi.mock("@/lib/toast", () => ({
  showApiErrorToast: showApiErrorToastMock,
  showSuccessToast: showSuccessToastMock,
}));

describe("ForgotPasswordPanel", () => {
  beforeEach(() => {
    showApiErrorToastMock.mockReset();
    showSuccessToastMock.mockReset();
    useForgotPasswordMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({
        message:
          "Password reset link generated for internal testing. Use it to continue the reset flow.",
        resetAvailable: true,
        resetToken: "reset-token-1",
        resetUrl:
          "http://localhost:3000/reset-password?token=reset-token-1&email=jane%40example.com",
      }),
    });
  });

  it("prefills the email and shows the generated internal reset link", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      message:
        "Password reset link generated for internal testing. Use it to continue the reset flow.",
      resetAvailable: true,
      resetToken: "reset-token-1",
      resetUrl:
        "http://localhost:3000/reset-password?token=reset-token-1&email=jane%40example.com",
    });
    useForgotPasswordMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    });

    render(<ForgotPasswordPanel />);

    expect(screen.getByLabelText(/email/i)).toHaveValue("jane@example.com");

    fireEvent.click(
      screen.getByRole("button", { name: /generate reset link/i }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "jane@example.com",
      });
    });

    expect(
      screen.getByDisplayValue(
        "http://localhost:3000/reset-password?token=reset-token-1&email=jane%40example.com",
      ),
    ).toBeInTheDocument();
    expect(showSuccessToastMock).toHaveBeenCalled();
  });

  it("shows a clear inline error when reset generation is unavailable", async () => {
    useForgotPasswordMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(
        new ApiClientError({
          message: "Password reset demo links are disabled on this deployment.",
          code: "FORBIDDEN",
          status: 403,
        }),
      ),
    });

    render(<ForgotPasswordPanel />);

    fireEvent.click(
      screen.getByRole("button", { name: /generate reset link/i }),
    );

    expect(
      await screen.findByText(
        /password reset demo links are disabled on this deployment/i,
      ),
    ).toBeInTheDocument();
    expect(showApiErrorToastMock).toHaveBeenCalled();
  });
});
