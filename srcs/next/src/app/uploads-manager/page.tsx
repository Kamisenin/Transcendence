import { getMyUploads } from "@/actions/uploads";
import UploadsList from "./uploads-list";

export default async function UploadsPage() {
	const uploads = await getMyUploads();

	return (
		<div>
			<h1>Mes images</h1>
			<UploadsList uploads={uploads} />
		</div>
	);
}
