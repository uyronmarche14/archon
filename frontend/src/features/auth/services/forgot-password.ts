import type { ApiEnvelope } from "@/contracts/api";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from "@/contracts/auth";
import { apiClient, type ApiClientRequestConfig } from "@/services/http/axios-client";
import { normalizeApiClientError } from "@/services/http/api-client-error";

export async function forgotPassword(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  try {
    const response = await apiClient.post<ApiEnvelope<ForgotPasswordResponse>>(
      "/auth/password/forgot",
      request,
      {
        _skipAuthRefresh: true,
      } as ApiClientRequestConfig,
    );
    const data = response.data as ApiEnvelope<ForgotPasswordResponse>;

    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  } catch (error) {
    throw normalizeApiClientError(error);
  }
}
