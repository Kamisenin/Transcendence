"use client";

import { useState } from "react";
import { deleteUpload } from "@/actions/uploads";

function UploadsList({ uploads }: { uploads: Upload[] }) {
	const [localUploads, setLocalUploads] = useState(uploads);

	async function handleDelete(uploadId: number) {
		try {
			await deleteUpload(uploadId);
			setLocalUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
		} catch (error) {
			console.error("Error:", error);
		}
	}

	return (
		<ul>
			{localUploads.map((upload) => (
				<li key={upload.id}>
					<img src={upload.url} alt={upload.fileName} />
					<p>{upload.fileName}</p>
					<button onClick={() => handleDelete(upload.id)}>
						Supprimer
					</button>
				</li>
			))}
		</ul>
	);
}

export default UploadsList;
