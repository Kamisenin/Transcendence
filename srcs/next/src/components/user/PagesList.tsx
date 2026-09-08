
import { filterPages, getEditablePages } from "@/actions/pages";
import { User } from "@prisma/client";
import ForumCard from "../ForumCard";
import { getTranslations } from "next-intl/server";


type Props = {
  target: User;
  currentUserId?: string;
};

export default async function PagesList({ target, currentUserId }: Props)
{
	const editablePages = await getEditablePages(target.user_id);

    const t = await getTranslations("Friend");
    const filteredpages = await filterPages(currentUserId, editablePages);
	
	return (
		<section className="flex h-[400px] flex-col border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-4 shadow-[0_2px_8px_rgba(128,0,0,0.08)]">
			<h2 className="text-xl font-bold mb-4">
			{t("pages", { user: target.username, number: filteredpages.length })}
			</h2>

			<div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
				{filteredpages.length > 0 ? (
					<div className="grid grid-cols-1 gap-4">
						{filteredpages.map((page) => (
							<ForumCard
								key={page.pageId}
								page={page}
								userId={currentUserId}
							/>
						))}
					</div>
				) : (
						<p className="text-sm text-muted-foreground py-8 text-center">
							{t("noPageFound")}
					</p>
				)}
			</div>
		</section>
	);
}
