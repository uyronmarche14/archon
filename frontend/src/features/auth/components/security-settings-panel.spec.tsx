import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecuritySettingsPanel } from "@/features/auth/components/security-settings-panel";

const replaceMock = vi.hoisted(() => vi.fn());
const useChangePasswordMock = vi.hoisted(() => vi.fn());
const clearSessionMock = vi.hoisted(() => vi.fn());
const showApiErrorToastMock = vi.hoisted(() => vi.fn());
const showSuccessToastMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/features/auth/hooks/use-change-password", () => ({
  useChangePassword: useChangePasswordMock,
}));

vi.mock("@/features/auth/providers/auth-session-provider", () => ({
  useAuthSession: () => ({
    clearSession: clearSessionMock,
    session: {
      user: {
        id: "user-1",
        name: "Jane Doe",
        email: "jane@example.com",
        role: "MEMBER" as const,
      },
    },
  }),
}));

vi.mock("@/lib/toast", () => ({
  showApiErrorToast: showApiErrorToastMock,
  showSuccessToast: showSuccessToastMock,
}));

describe("SecuritySettingsPanel", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    clearSessionMock.mockReset();
    showApiErrorToastMock.mockReset();
    showSuccessToastMock.mockReset();
    useChangePasswordMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({
        message: "Password changed successfully. Please log in again.",
        email: "jane@example.com",
      }),
    });
  });

  it("changes the password, clears the session, and routes back to login", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      message: "Password changed successfully. Please log in again.",
      email: "jane@example.com",
    });
    useChangePasswordMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    });

    render(<SecuritySettingsPanel />);

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "StrongPass1" },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "NewStrongPass1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "NewStrongPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save new password/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        currentPassword: "StrongPass1",
        newPassword: "NewStrongPass1",
      });
    });

    expect(clearSessionMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith(
      "/login?email=jane%40example.com",
    );
    expect(showSuccessToastMock).toHaveBeenCalled();
  });
});
