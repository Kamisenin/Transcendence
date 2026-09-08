"use client";

import { useState } from "react";
import { deleteUpload, SerializedUpload } from "@/actions/uploads";
import { Upload } from "@prisma/client";
import { useTranslations } from "next-intl";

function UploadsList({ uploads }: { uploads: SerializedUpload[] }) {
	const [localUploads, setLocalUploads] = useState(uploads);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const t = useTranslations("Common");

	function formatFileSize(bytesInput: string) {
		const bytes = Number(bytesInput)
		const seuilMo = 1024 * 1024; // 1 Mo

		if (bytes < seuilMo) {
			return `${(bytes / 1024).toFixed(1)} Ko`;
		}

		return `${(bytes / seuilMo).toFixed(2)} Mo`;
	}
	async function handleDelete(uploadId: number) {
		setDeletingId(uploadId);
		try {
			await deleteUpload(uploadId);
			setLocalUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
		} catch (error) {
			console.error("Error:", error);
		} finally {
			setDeletingId(null);
		}
	}

	if (localUploads.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 py-16 text-center">
				<p className="text-slate-500">{t('noImagesYet')}</p>
			</div>
		);
	}

	return (
		<ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
			{localUploads.map((upload) => (
				<li
					key={upload.id}
					className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
				>
					<div className="aspect-square w-full overflow-hidden bg-slate-100">
						<img
							src={upload.url}
							alt={upload.fileName}
							className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
						/>
					</div>

					<div className="p-3">
						<p className="truncate text-sm font-medium text-slate-700">
							{upload.fileName}
						</p>
						<p className="text-xs text-slate-400">
							{formatFileSize(upload.fileSize)}
						</p>
					</div>

					<button
						onClick={() => handleDelete(upload.id)}
						disabled={deletingId === upload.id}
						className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow-sm backdrop-blur transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-100"
						aria-label={t('delete')}
					>
						{deletingId === upload.id ? (
							<svg
								className="h-4 w-4 animate-spin"
								viewBox="0 0 24 24"
								fill="none"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
								/>
							</svg>
						) : (
							<svg
								className="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M9 2a1 1 0 00-1 1v1H4a1 1 0 000 2h12a1 1 0 100-2h-4V3a1 1 0 00-1-1H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</button>
				</li>
			))}
		</ul>
	);
}

export default UploadsList;
