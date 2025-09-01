import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" });
    }

    const { message } = await req.json().catch(() => ({ message: "xin chào" }));
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: [{ role: "user", content: message ?? "xin chào" }],
        }),
    });

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // <- điểm mấu chốt: trả kèm model mà OpenAI trả về
    return NextResponse.json({
        ok: resp.ok,
        status: resp.status,
        // model bạn yêu cầu…
        requestedModel: model,
        // …và model OpenAI thực sự dùng (chứng cứ)
        upstreamModel: data?.model ?? "(no model in response)",
        data,
    });
}
