import { getUserOrgs } from "@/actions/orgs";
import { User } from "@prisma/client";
import OrgCard from "../orgs/OrgCard";
import { getTranslations } from "next-intl/server";

type Props = {
	target: User;
};

export default async function OrgsList({ target }: Props) {
	const orgs = await getUserOrgs(target);
	const t = await getTranslations("Orgs");
 
	return (
		<section className="flex h-[400px] flex-col border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-4 shadow-[0_2px_8px_rgba(128,0,0,0.08)]">
			<h2 className="mb-4 text-xl font-bold text-[#3f2924]">
				{t("organizationsOf", { user: target.username, count: orgs?.length ?? 0 })}
			</h2>
 
			<div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
				{orgs && orgs.length > 0 ? (
					<div className="grid grid-cols-1 gap-4">
						{orgs.map((org) => (
							<OrgCard
								key={org.id}
								organization={org}
							/>
						))}
					</div>
				) : (
					<p className="py-8 text-center text-sm text-[#8a6b63]">
						{t("noOrganizationsFound")}
					</p>
				)}
			</div>
		</section>
	);
}
