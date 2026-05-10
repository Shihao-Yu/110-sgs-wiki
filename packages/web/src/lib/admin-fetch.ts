export interface AdminFetchError {
  status: number;
  message: string;
  fieldErrors?: Array<{ path: string; message: string }>;
}

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });
  const ct = r.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await r.json().catch(() => null) : null;
  if (!r.ok) {
    const err: AdminFetchError = {
      status: r.status,
      message: body?.error ?? body?.detail ?? r.statusText,
      fieldErrors: body?.errors,
    };
    throw err;
  }
  return body as T;
}
