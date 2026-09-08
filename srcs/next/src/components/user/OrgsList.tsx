import { getUserOrgs } from "@/actions/orgs";
import { User } from "@prisma/client";
import OrgCard from "../OrgCard";

export default async function OrgsList({ target }: Props) {
	const orgs = await getUserOrgs(target);
 
	return (
		<section className="bg-card text-card-foreground border border-border rounded-lg p-4 shadow-md h-[400px] flex flex-col">
			<h2 className="text-xl font-bold mb-4">
				Organisations ({orgs?.length ?? 0})
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
					<p className="text-sm text-muted-foreground py-8 text-center">
						Aucune organisation trouvée.
					</p>
				)}
			</div>
		</section>
	);
}
