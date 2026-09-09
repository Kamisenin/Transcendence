import ReadOnlyBlock from '@/components/page/ReadOnlyBlock';
import Infobox, { type InfoboxData } from '@/components/page/Infobox';
import { requireUser } from "@/actions/tags"
import Link from "next/link";

type SavedBlock = {
    id: string;
    type?: 'editor' | 'infobox';
    value?: any[];
    infoboxData?: InfoboxData;
    x: number;
    y: number;
    w: number;
    h: number;
};

export default async function PageViewer({ title, blocks, accountId, canEdit, editHref }: { title?: string; blocks: SavedBlock[]; accountId : string | undefined; canEdit?: boolean; editHref?: string; }) {
    const COLS = 12;
    const ROW_HEIGHT = 150;
    const maxRow = blocks.length === 0
        ? 0
        : Math.max(...blocks.map((block) => block.y + block.h));
    const totalHeight = Math.max(500, maxRow * ROW_HEIGHT + Math.max(0, maxRow - 1) * 5);

    const user = await requireUser();

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pt-20">
            {title && (
                <div className="w-full max-w-6xl mx-auto flex items-center justify-between border-b pb-4 mb-8">
                    <h1 className="text-3xl font-bold text-gray-950">
                        {title}
                    </h1>
                    {canEdit && editHref && (
                        <Link
                            href={editHref}
                            className="shrink-0 px-3 py-1 rounded bg-[#800000] text-[#fffaf7] text-sm hover:bg-[#5f0000]"
                        >
                            Edit
                        </Link>
                    )}
                </div>
            )}

            <div
                className="max-w-6xl mx-auto bg-transparent grid"
                style={{
                    minHeight: `${totalHeight}px`,
                    gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                    gridAutoRows: `${ROW_HEIGHT}px`,
                    gap: '5px'
                }}
            >
                {blocks.map((block) => (
                    <div
                        key={block.id}
                        className={
                            block.type === 'infobox'
                                ? "overflow-hidden"
                                : "bg-white border border-gray-100 shadow-sm rounded overflow-hidden"
                        }
                        style={{
                            gridColumn: `${block.x + 1} / span ${block.w}`,
                            gridRow: `${block.y + 1} / span ${block.h}`
                        }}
                    >
                        {block.type === 'infobox' ? (
                            <div className="h-full overflow-auto">
                                <Infobox
                                    accountId={user.accountId}
                                    id={block.id}
                                    pageId={0}
                                    data={block.infoboxData || { title: '', imageUrl: '', description: '', tags: [], public: true }}
                                    isReadOnly={true}
                                />
                            </div>
                        ) : (
                            <div className="p-2 h-full overflow-auto">
                                <ReadOnlyBlock value={block.value || []} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}