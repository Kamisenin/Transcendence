import { NextRequest, NextResponse } from "next/server";
import { getOwnedPages, getAccessiblePages } from "@/actions/pages";
import { getSessionCookie, getSessionUser } from "%/lib/session";

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser(await getSessionCookie());
        if (!user) {
            return NextResponse.json({ ok: false, error: "AUTH_REQUIRED" }, { status: 401 });
        }

        const tab = req.nextUrl.searchParams.get("tab") || "owned";

        if (tab === "owned") {
            const pages = await getOwnedPages();
            return NextResponse.json({ ok: true, pages });
        } else if (tab === "accessible") {
            const pages = await getAccessiblePages();
            return NextResponse.json({ ok: true, pages });
        } else {
            return NextResponse.json({ ok: false, error: "Invalid tab" }, { status: 400 });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}