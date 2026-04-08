"use client";

import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/features/auth/services/change-password";

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
