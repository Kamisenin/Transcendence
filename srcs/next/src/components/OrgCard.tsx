import { Organization } from "@prisma/client";
import Link from "next/link";

interface OrgCardProps {
	organization: Organization & {
		members?: unknown[];
	};
}

export default function OrgCard({ organization }: OrgCardProps) {
	const initials = organization.name
		.split(" ")
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();

	const createdAt = new Date(organization.createdAt).toLocaleDateString(
		"fr-FR",
		{
			day: "numeric",
			month: "short",
			year: "numeric",
		}
	);

	return (
		<Link
			href={`/orgs/${organization.name}`}
		>
			<div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
				<div className="flex items-center gap-4">
					{/* Logo / Initiales */}
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 font-bold">
						{initials}
					</div>

					{/* Informations */}
					<div className="min-w-0 flex-1">
						<h3 className="truncate text-base font-semibold text-gray-900">
							{organization.name}
						</h3>

						<p className="mt-1 text-xs text-gray-500">
							Créée le {createdAt}
						</p>
					</div>
				</div>

				{/* Membres */}
				{organization.members && (
					<div className="mt-4 border-t border-gray-100 pt-3">
						<p className="text-sm text-gray-500">
							<span className="font-semibold text-gray-800">
								{organization.members.length}
							</span>{" "}
							{organization.members.length > 1 ? "membres" : "membre"}
						</p>
					</div>
				)}
			</div>
		</Link>
	);
}
