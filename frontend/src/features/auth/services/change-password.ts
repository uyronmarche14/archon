import type { ApiEnvelope } from "@/contracts/api";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "@/contracts/auth";
import { apiClient } from "@/services/http/axios-client";
import { normalizeApiClientError } from "@/services/http/api-client-error";

export async function changePassword(
  request: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  try {
    const response = await apiClient.post<ApiEnvelope<ChangePasswordResponse>>(
      "/auth/password/change",
      request,
    );
    const data = response.data as ApiEnvelope<ChangePasswordResponse>;

    if (!data.success) {
      throw new Error(data.error.message);
    }

    return data.data;
  } catch (error) {
    throw normalizeApiClientError(error);
  }
}
