"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function UploadProfilePicture({
	initialImgLink,
}: {
	initialImgLink?: string | null;
}) {
	const [isUploading, setIsUploading] = useState(false);
	const [imgLink, setImgLink] = useState(initialImgLink);
	const t = useTranslations("Common");

	function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		uploadFile(file);
	}

	async function uploadFile(file: File) {
		if (!file.type.startsWith("image/")) {
			alert(t("selectValidImage"))
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			alert(t("imageTooLarge"))
			return;
		}

		try {
			setIsUploading(true);

			const formData = new FormData();
			formData.append("file", file);

			const responseUpload = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!responseUpload.ok) {
				throw new Error("Erreur lors de l'upload");
			}

			const data = await responseUpload.json();

			const responsePrisma = await fetch("/api/auth/change_profile_picture", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					newPath: data.path,
				}),
			});

			if (!responsePrisma.ok) {
				throw new Error("Erreur lors de la mise à jour du profil");
			}

			setImgLink(data.path);
		} catch (error) {
			console.error(error);
			alert(t("uploadImageFailed"))
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<label className="cursor-pointer relative">
			<input
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleUpload}
				disabled={isUploading}
			/>

			<div className="w-11 h-11 shrink-0 rounded-full bg-white border-2 border-black shadow-sm hover:shadow-md transition flex items-center justify-center overflow-hidden">
				<Image
					src={imgLink || "/defaultUserProfilePicture.svg"}
					alt="Profile picture"
					width={44}
					height={44}
					className="w-full h-full object-cover"
				/>

				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
						<svg
							className="h-5 w-5 animate-spin text-white"
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
					</div>
				)}
			</div>
		</label>
	);
}
