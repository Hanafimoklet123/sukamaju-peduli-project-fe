export const API_MODE = process.env.NEXT_PUBLIC_DATA_MODE !== "demo";
export const DEMO_SHORTCUTS =
  process.env.NEXT_PUBLIC_ENABLE_DEMO === "true" || !API_MODE;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers:
        body instanceof FormData
          ? undefined
          : body
            ? { "Content-Type": "application/json" }
            : undefined,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(
      "Server belum dapat dihubungi. Periksa backend dan koneksi, lalu coba lagi.",
      0,
    );
  }
  let data: { message?: string | string[] } & T;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "Respons server tidak valid. Periksa backend.",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(
      Array.isArray(data.message)
        ? data.message.join(" ")
        : data.message || "Permintaan belum berhasil.",
      response.status,
    );
  return data;
}
