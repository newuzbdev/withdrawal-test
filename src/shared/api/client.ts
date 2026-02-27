const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(status: number, message: string, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
  }
}

export async function request<TResponse>(
  path: string,
  options: RequestInit
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      ...options,
    });
  } catch (error) {
    throw new NetworkError(
      error instanceof Error ? error.message : "Network error"
    );
  }

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as any).message === "string" &&
        (data as any).message) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, data);
  }

  return data as TResponse;
}

