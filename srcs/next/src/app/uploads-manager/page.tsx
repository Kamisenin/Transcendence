import { getMyUploads } from "@/actions/uploads";
import UploadsList from "./uploads-list";

export default async function UploadsPage() {
	const uploads = await getMyUploads();

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 pt-20 py-10">
			<div className="mx-auto max-w-5xl">
				<div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
					<h1 className="text-3xl font-semibold tracking-tight text-slate-900">
						Mes images
					</h1>
					<span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white">
						{uploads?.length ?? 0} fichier(s)
					</span>
				</div>

				<UploadsList uploads={uploads} />
			</div>
		</div>
	);
}
