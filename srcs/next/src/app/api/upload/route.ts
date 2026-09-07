import { prisma } from "%/lib/prisma/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"
import { requireUser } from '@/actions/tags'

export async function POST(request: Request) {
    console.log("1 - route appelée")
    const user = await requireUser();

    const formData = await request.formData()

    console.log("2 - formData OK")

    const file = formData.get("file")

    console.log(
        "3 - file :",
        file instanceof File ? file.name : null
    )

    if (!(file instanceof File)) {
        return Response.json(
            { error: "Aucun fichier" },
            { status: 400 }
        )
    }

    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")

    const id = crypto.randomUUID()

    const extension = path.extname(file.name).toLowerCase()

    const filename = `${id}${extension}`

    const relativeDir = path.join(
        "upload",
        String(year),
        month,
        day
    )
	const upDir = process.env.NEXT_UPLOADS_PATH || "/";

    const uploadDir = path.join(
        upDir,
        relativeDir
    )

    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filePath = path.join(
        uploadDir,
        filename
    )

    await writeFile(filePath, buffer)

    console.log(
        "4 - fichier sauvegardé :",
        filePath
    )

    const url = `/api/${relativeDir.replaceAll(path.sep, "/")}/${filename}`

    const upload = await prisma.upload.create({
        data: {
            url,
			fileName: file.name,
            fileSize: BigInt(file.size),
            ownerToken: user.user_id,
        },
    })

    console.log("5 - prisma OK")

    return Response.json({
        path: upload.url,
    })
}
