export async function postJSON<T>(url: string, body: unknown, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        body: JSON.stringify(body),
        cache: "no-store",
        ...init,
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* ignore parse error */ }

    if (!res.ok) {
        const err = new Error(json?.error || text || `HTTP ${res.status}`);
        (err as any).status = res.status;
        (err as any).payload = json ?? text;
        throw err;
    }
    return json as T;
}

export async function getJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
}
