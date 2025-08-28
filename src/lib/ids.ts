// 📁 File: src/lib/ids.ts (tiện ích tạo ID)
export function rid(prefix = "req") {
    return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}


export function hashIdempotency(body: unknown) {
// Hash đơn giản (dev). Prod: dùng crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")
    return `idem_${Buffer.from(JSON.stringify(body)).toString("base64").slice(0, 50)}`;
}