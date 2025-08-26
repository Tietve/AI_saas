import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change");
const cookieName = "session";
const isProd = process.env.NODE_ENV === "production";

export type SessionPayload = { uid: string; email: string };

export async function createSessionCookie(payload: SessionPayload) {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    return {
        name: cookieName,
        value: jwt,
        options: {
            httpOnly: true,
            sameSite: "lax" as const,
            secure: isProd,
            path: "/",
        },
    } as const;
}

export async function verifySessionCookie(token: string) {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload & { iat: number; exp: number };
}

export function destroySessionCookie() {
    return {
        name: cookieName,
        value: "",
        options: { httpOnly: true, sameSite: "lax" as const, secure: isProd, path: "/", maxAge: 0 },
    } as const;
}
