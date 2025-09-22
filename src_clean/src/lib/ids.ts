
export function rid(prefix = "req") {
    return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}


export function hashIdempotency(body: unknown) {

    return `idem_${Buffer.from(JSON.stringify(body)).toString("base64").slice(0, 50)}`;
}