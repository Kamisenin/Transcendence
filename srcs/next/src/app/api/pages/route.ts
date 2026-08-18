import { NextRequest, NextResponse } from "next/server";
import { getOwnedPages, getAccessiblePages } from "@/actions/pages";

export async function GET(req: NextRequest) {
    try {
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
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "Server error" }, { status: 500 });
    }
}