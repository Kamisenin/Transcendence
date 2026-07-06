import { NextRequest, NextResponse } from "next/server";;
import { deleteSession } from '%/lib/session';

export async function POST(req: NextRequest) {

    const token = req.cookies.get("session_id")?.value;
    console.log("token : " + token);
    if (!token || token === "")
        return NextResponse.json({ error: "No Session ID"}, { status: 400});
    await deleteSession(token);
    const response = NextResponse.json({ success: true });
    response.cookies.delete("session_id");
    return response;
}