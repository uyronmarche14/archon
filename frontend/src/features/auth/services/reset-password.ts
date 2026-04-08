import type { ApiEnvelope } from "@/contracts/api";
import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@/contracts/auth";
import { apiClient, type ApiClientRequestConfig } from "@/services/http/axios-client";
import { normalizeApiClientError } from "@/services/http/api-client-error";

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  try {
    const response = await apiClient.post<ApiEnvelope<ResetPasswordResponse>>(
      "/auth/password/reset",
      request,
      {
        _skipAuthRefresh: true,
      } as ApiClientRequestConfig,
    );
    const data = response.data as ApiEnvelope<ResetPasswordResponse>;

    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  } catch (error) {
    throw normalizeApiClientError(error);
  }
}
