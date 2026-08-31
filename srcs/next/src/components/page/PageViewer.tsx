import ReadOnlyBlock from '@/components/page/ReadOnlyBlock';
import Infobox, { type InfoboxData } from '@/components/page/Infobox';

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

export default function PageViewer({ title, blocks }: { title?: string; blocks: SavedBlock[]; }) {
    const COLS = 12;
    const ROW_HEIGHT = 40;
    const MARGIN_X = 16;
    const MARGIN_Y = 16;
    const CONTAINER_WIDTH = 1156;
    const COL_WIDTH = (CONTAINER_WIDTH - (COLS - 1) * MARGIN_X) / COLS;

    const positioned: PositionedBlock[] = blocks.map((b) => {
        const left = b.x * (COL_WIDTH + MARGIN_X);
        const top = b.y * (ROW_HEIGHT + MARGIN_Y);
        const width = b.w * COL_WIDTH + (b.w - 1) * MARGIN_X;
        const height = b.h * ROW_HEIGHT + (b.h - 1) * MARGIN_Y * 10; // Need a 10x multiplier to have a correct height rendering

        return {
            ...b,
            _px: { left, top, width, height }
        };
    });

    const totalHeight =
        positioned.length === 0
            ? 500
            : Math.max(...positioned.map((b) => b._px.top + b._px.height)) + MARGIN_Y;

    console.log(
        '[PageViewerSSR] blocks',
        blocks.map(b => ({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, type: b.type }))
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pt-20">
            {title && (
                <h1 className="text-3xl font-bold mb-8 w-full max-w-6xl mx-auto block text-gray-950 border-b pb-4">
                    {title}
                </h1>
            )}

            <div ref={containerRef} className="max-w-6xl mx-auto bg-transparent min-h-[500px] relative">
                <ReactGridLayout
                    className="layout"
                    layout={layout}
                    cols={12}
                    rowHeight={40}
                    margin={[16, 16]}
                    width={width}
                    isDraggable={false}
                    isResizable={false}
                >
                    {blocks.map(block => (
                        <div key={block.id} className="relative bg-white border border-gray-100 shadow-sm rounded overflow-y-auto">
                            {block.type === 'infobox' ? (
                                <Infobox
                                    id={block.id}
                                    pageId={0}
                                    data={block.infoboxData || { title: '', imageUrl: '', description: '', tags: [] }}
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