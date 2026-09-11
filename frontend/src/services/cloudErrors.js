// Return translation keys, never server responses containing account details.
export function cloudErrorKey(error) {
  if (error?.code === "invalid_credentials") return "invalidCredentials";
  if (error?.code === "email_not_confirmed") return "emailNotConfirmed";
  if (["PGRST205", "42P01"].includes(error?.code)) return "cloudTableMissing";
  if (error?.code === "42501") return "cloudPermissionDenied";
  if (error?.status === 429) return "cloudRateLimited";
  if (error?.status === 401 || error?.name === "AuthSessionMissingError") return "signInRequired";
  if (error?.name === "AbortError" || error?.name === "TimeoutError" || error?.name === "TypeError" || error?.name === "AuthRetryableFetchError") return "cloudUnreachable";
  return "syncError";
}
