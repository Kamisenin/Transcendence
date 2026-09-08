import Link from "next/link";
import type { Organization } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import type { OrgSummary } from "./orgTypes";

interface OrgCardProps {
	org?: OrgSummary;
	organization?: Organization & { members?: unknown[] };
}

export default async function OrgCard({ org, organization }: OrgCardProps) {
	const data = org ?? organization;
	if (!data) return null;
	const t = await getTranslations("Orgs");
	const locale = await getLocale();

	const initials = data.name
		.split(" ")
		.slice(0, 2)
		.map((word) => word[0])
		.join("")
		.toUpperCase();

	const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleDateString(
		locale,
		{
			day: "numeric",
			month: "short",
			year: "numeric",
		}
	) : "—";

	return (
		<Link
			href={`/orgs/${encodeURIComponent(data.name)}`}
		>
			<div className="w-full border border-[#d9bfb7] border-l-4 border-l-[#800000] bg-[#fffaf7] p-4 shadow-[0_2px_8px_rgba(128,0,0,0.06)] transition hover:-translate-y-0.5 hover:border-[#800000] hover:shadow-md">
				<div className="flex items-center gap-4">
					{/* Logo / Initiales */}
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f7e9e2] font-bold text-[#800000]">
						{initials}
					</div>

					{/* Informations */}
					<div className="min-w-0 flex-1">
						<h3 className="truncate text-base font-semibold text-[#3f2924]">
							{data.name}
						</h3>

						<p className="mt-1 text-xs text-[#8a6b63]">
							{t("created", { date: createdAt })}
						</p>
					</div>
				</div>

				{organization?.members && (
					<div className="mt-4 border-t border-[#ead7d0] pt-3">
						<p className="text-sm text-[#8a6b63]">
							<span className="font-semibold text-[#3f2924]">{organization.members.length}</span>{" "}
							{t("membersCount", { count: organization.members.length })}
						</p>
					</div>
				)}
			</div>
		</Link>
	);
}
