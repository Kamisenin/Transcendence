import { getMyUploads } from "@/actions/uploads";
import UploadsList from "./uploads-list";
import { getTranslations } from "next-intl/server";

export default async function UploadsPage() {
	const uploads = await getMyUploads();
	const t = await getTranslations("Common");

	return (
		<div className="min-h-screen bg-[#f0e0d6] px-4 pb-12 pt-20 text-[#3f2924]">
			<div className="mx-auto max-w-5xl">
				<div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
					<h1 className="text-3xl font-semibold tracking-tight text-slate-900">
						{t("myImages")}
					</h1>
					<span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">
						{t("fileCount", { count: uploads?.length ?? 0 })}
					</span>
				</div>

				<UploadsList uploads={uploads} />
			</div>
		</div>
	);
}
