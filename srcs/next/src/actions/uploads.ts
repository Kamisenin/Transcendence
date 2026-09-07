"use server";

import { prisma } from '%/lib/prisma/prisma';
import { requireUser } from "@/actions/tags";
import { unlink } from "fs/promises";
import { join } from "path";

export async function getMyUploads() {
	const user = await requireUser();

	const uploads = await prisma.upload.findMany({
		where: { ownerToken: user.user_id },
		orderBy: { createdAt: "desc" },
	});

	return uploads.map((upload) => ({
		...upload,
		fileSize: upload.fileSize.toString(),
	}));
}

export async function deleteUpload(uploadId: number) {
	const user = await requireUser();
	const uploadDir = process.env.NEXT_UPLOADS_PATH || "/uploads";

	const file = await prisma.upload.findUnique({ where: { id: uploadId } })
	if (!file)
		throw new Error("File not found");
	if (file.ownerToken !== user.user_id)
		throw new Error("Forbidden");

	const filePath = join(uploadDir, file.url.replace("/api", ""));
	console.log(filePath);
	try {
		await unlink(filePath);
	} catch(error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			console.log("File not found")
		} else {
			throw error;
		}
	}
	await prisma.upload.delete({where: { id: uploadId }});
}
