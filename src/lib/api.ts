/**
 * Get the base API URL
 * In production with NEXT_PUBLIC_API_URL set, it will use the Azure backend
 * Otherwise, it uses relative URLs (current domain)
 */
export function getApiBaseUrl(): string {
    // If NEXT_PUBLIC_API_URL is set (production), use it
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL
    }

    // For client-side, use current origin
    if (typeof window !== 'undefined') {
        return window.location.origin
    }

    // For server-side rendering, use the app URL
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Build full API URL
 */
export function buildApiUrl(endpoint: string): string {
    const baseUrl = getApiBaseUrl()
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${baseUrl}${path}`
}

export async function postJSON<T>(url: string, body: unknown, init?: RequestInit): Promise<T> {
    // Auto-convert relative URLs to full URLs if needed
    const fullUrl = url.startsWith('http') ? url : buildApiUrl(url)

    const res = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        body: JSON.stringify(body),
        cache: "no-store",
        credentials: 'include', // Important for cookies
        ...init,
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {  }

    if (!res.ok) {
        const err = new Error(json?.error || text || `HTTP ${res.status}`);
        (err as any).status = res.status;
        (err as any).payload = json ?? text;
        throw err;
    }
    return json as T;
}

export async function getJSON<T>(url: string): Promise<T> {
    // Auto-convert relative URLs to full URLs if needed
    const fullUrl = url.startsWith('http') ? url : buildApiUrl(url)

    const res = await fetch(fullUrl, {
        cache: "no-store",
        credentials: 'include' // Important for cookies
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
}
