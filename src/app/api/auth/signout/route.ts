import { NextResponse } from "next/server";
import { destroySessionCookie } from "@/lib/session";


export async function POST() {
    const { name, value, options } = destroySessionCookie();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(name, value, options as any);
    return res;
}