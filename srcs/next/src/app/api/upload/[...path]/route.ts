import { resolve } from "path"
import { readFile } from "node:fs/promises"
import mime from "mime"

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
	const { path: pathSegments } = await params;
	const userPath = pathSegments.join("/");

	const baseDir = process.env.NEXT_UPLOADS_PATH + "/upload" || "/upload";

	const fullPath = resolve(baseDir, userPath);

	console.log("baseDir:", baseDir);
	console.log("userPath:", userPath);
	console.log("fullPath:", fullPath);
	console.log("startsWith?:", fullPath.startsWith(baseDir));
	if (!fullPath.startsWith(baseDir)) {
		return new Response("Forbidden", { status: 403});
	}
	const fileBuffer = await readFile(fullPath);
	const contentType = mime.getType(fullPath) || "applocation/octet-stream"; // a quoi ça sert ?
	return new Response(fileBuffer, {
		headers: { "Content-Type": contentType },
	});
}
