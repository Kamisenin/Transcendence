import ReadOnlyBlock from '@/components/page/ReadOnlyBlock';
import Infobox, { type InfoboxData } from '@/components/page/Infobox';
import { requireUser } from "@/actions/tags"

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

type PositionedBlock = SavedBlock & {
    _px: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
};

export default async function PageViewer({ title, blocks }: { title?: string; blocks: SavedBlock[]; }) {
    const COLS = 12;
    const ROW_HEIGHT = 150;
    const MARGIN_X = 5;
    const MARGIN_Y = 5;
    const CONTAINER_WIDTH = 1156;
    const COL_WIDTH = (CONTAINER_WIDTH - (COLS - 1) * MARGIN_X) / COLS;

    const positioned: PositionedBlock[] = blocks.map((b) => {
        const left = b.x * (COL_WIDTH + MARGIN_X);
        const top = b.y * (ROW_HEIGHT + MARGIN_Y);
        const width = b.w * COL_WIDTH + (b.w - 1) * MARGIN_X;
        const height = b.h * ROW_HEIGHT + (b.h - 1) * MARGIN_Y

        return {
            ...b,
            _px: { left, top, width, height }
        };
    });

    const totalHeight =
        positioned.length === 0
            ? 500
            : Math.max(...positioned.map((b) => b._px.top + b._px.height)) + MARGIN_Y;

    const user = await requireUser();

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pt-20">
            {title && (
                <h1 className="text-3xl font-bold mb-8 w-full max-w-6xl mx-auto block text-gray-950 border-b pb-4">
                    {title}
                </h1>
            )}

            <div
                className="max-w-6xl mx-auto bg-transparent relative"
                style={{ minHeight: `${totalHeight}px` }}
            >
                {positioned.map((block) => (
                    <div
                        key={block.id}
                        className={
                            block.type === 'infobox'
                                ? "absolute overflow-hidden"
                                : "absolute bg-white border border-gray-100 shadow-sm rounded overflow-hidden"
                        }
                        style={{
                            left: `${block._px.left}px`,
                            top: `${block._px.top}px`,
                            width: `${block._px.width}px`,
                            height: `${block._px.height}px`
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