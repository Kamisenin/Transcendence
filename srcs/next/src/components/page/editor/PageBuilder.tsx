"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { BaseEditor, Descendant } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { ToolbarRef } from "@/components/page/editor/Toolbar";
import ReactGridLayout, { type Layout } from 'react-grid-layout';
import dynamic from 'next/dynamic';
import WikiEditor from "@/components/page/editor/WikiEditor";
import Infobox, { type InfoboxData } from "@/components/page/Infobox";
import { savePage } from "@/actions/pages";

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const Toolbar = dynamic(() => import('@/components/page/editor/Toolbar'), { ssr: false });

type EditorInstance = BaseEditor & ReactEditor;

export type BlockType = 'editor' | 'infobox';

export type SavedBlock = {
    id: string;
    type?: BlockType;
    value?: Descendant[];
    infoboxData?: InfoboxData;
    x: number;
    y: number;
    w: number;
    h: number;
};

type Props = {
    accountId: string;
    pageId: number;
    initialTitle?: string;
    initialBlocks: SavedBlock[];
    visibility: boolean;
    canonicalNamespace?: string;
};

const emptyValue = (): Descendant[] => [
    { type: "paragraph", children: [{ text: "" }] }
];

const DEFAULT_INFOBOX: InfoboxData = {
    title: "",
    imageUrl: "",
    description: "",
    tags: [],
    public: false
};

export default function PageBuilder({ accountId, pageId, initialTitle, initialBlocks, visibility, canonicalNamespace}: Props) {
    const [saving, setSaving] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeEditor, setActiveEditor] = useState<EditorInstance | null>(null);
    const toolbarRef = useRef<ToolbarRef>(null);

    const [blocks, setBlocks] = useState<SavedBlock[]>(() => {
        if (initialBlocks.length > 0) {
            const hasInfobox = initialBlocks.some(b => b.type === 'infobox');
            if (hasInfobox) {
                return initialBlocks.map(b =>
                    b.type === 'infobox'
                        ? { ...b, infoboxData: { ...b.infoboxData!, public: visibility, canonicalNamespace } }
                        : b
                );
            }

            return [
                {
                    id: "block-infobox",
                    type: "infobox",
                    infoboxData: { ...DEFAULT_INFOBOX, title: initialTitle || "", public: visibility, canonicalNamespace },
                    x: 0, y: 0, w: 4, h: 8
                },
                ...initialBlocks
            ];
        }
        return [
            {
                id: "block-infobox",
                type: "infobox",
                infoboxData: { ...DEFAULT_INFOBOX, title: initialTitle || "", public: visibility, canonicalNamespace },
                x: 0, y: 0, w: 4, h: 8
            },
            {
                id: "block-1",
                type: "editor",
                value: emptyValue(),
                x: 4, y: 0, w: 8, h: 8
            }
        ];
    });

    const [layout, setLayout] = useState<Layout[]>(() =>
        blocks.map(b => ({ i: b.id, x: b.x, y: b.y, w: b.w, h: b.h }))
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(1200);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const editors = useMemo(() => new Map<string, EditorInstance>(), []);

    const registerEditor = useCallback((id: string, editor: EditorInstance) => {
        editors.set(id, editor);
    }, [editors]);

    const unregisterEditor = useCallback((id: string) => {
        editors.delete(id);
        setActiveId(prev => (prev === id ? null : prev));
    }, [editors]);

    /*-----------------------------------
    * -------------HANDLERS--------------
    * ----------------------------------*/

    const handleAddBlock = useCallback(() => {
        const newId = `block-${Date.now()}`;
        const newBlock: SavedBlock = { id: newId, type: 'editor', value: emptyValue(), x: 0, y: 0, w: 6, h: 4 };

        setBlocks(prev => [...prev, newBlock]);
        setLayout(prev => {
            const nextY = prev.reduce((max, item) => Math.max(max, item.y + item.h), 0);
            return [...prev, { i: newId, x: 0, y: nextY, w: newBlock.w, h: newBlock.h }];
        });
    }, []);

    const handleDeleteBlock = useCallback((id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id || b.type === 'infobox'));
        setLayout(prev => prev.filter(item => {
            const block = blocks.find(b => b.id === item.i);
            return item.i !== id || block?.type === 'infobox';
        }));
        unregisterEditor(id);
    }, [blocks, unregisterEditor]);

    const handleFocusChange = useCallback((id: string) => {
        setActiveId(id);
        const editorInstance = editors.get(id);
        if (editorInstance) setActiveEditor(editorInstance);
    }, [editors]);

    const handleBlockValueChange = useCallback((id: string, value: Descendant[]) => {
        setBlocks(prev => prev.map(b => (b.id === id ? { ...b, value } : b)));
    }, []);

    const handleInfoboxChange = useCallback((id: string, infoboxData: InfoboxData) => {
        setBlocks(prev => prev.map(b => (b.id === id ? { ...b, infoboxData } : b)));
    }, []);

    async function handleSave() {
        setSaving(true);
        try {
            const mainInfobox = blocks.find(b => b.type === 'infobox');
            const pageTitle = mainInfobox?.infoboxData?.title || initialTitle || "untitled";
            const visibility = mainInfobox?.infoboxData?.public || false;
            const namespace = mainInfobox?.infoboxData?.canonicalNamespace;

            const content = {
                blocks: blocks.map(block => {
                    const layoutItem = layout.find(l => l.i === block.id)!;
                    return {
                        id: block.id,
                        type: block.type || 'editor',
                        x: layoutItem.x,
                        y: layoutItem.y,
                        w: layoutItem.w,
                        h: layoutItem.h,
                        value: block.value,
                        infoboxData: block.infoboxData
                    };
                }),
            };
            await savePage(pageId, pageTitle, content as any, mainInfobox?.infoboxData, visibility, namespace);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pt-20">
            <Toolbar ref={toolbarRef} editor={activeEditor} disabled={!activeEditor} onAddBlock={handleAddBlock} />

            <button
                onClick={handleSave}
                disabled={saving}
                className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold"
            >
                {saving ? 'Saving...' : 'Save'}
            </button>

            <div ref={containerRef} className="max-w-6xl mx-auto border rounded-xl bg-white p-4 min-h-[500px] shadow-sm relative mt-4">
                <ReactGridLayout
                    className="layout"
                    layout={layout}
                    onLayoutChange={(newLayout) => setLayout(newLayout)}
                    cols={12}
                    rowHeight={40}
                    margin={[16, 16]}
                    width={width}
                    draggableHandle=".drag-handle"
                    draggableCancel="input, textarea, [contenteditable], button"
                >
                    {blocks.map(block => (
                        <div key={block.id} className="relative group/grid-item">
                            {block.type === 'infobox' ? (
                                <Infobox
                                    accountId={{accountId}}
                                    id={block.id}
                                    pageId={pageId}
                                    data={block.infoboxData || DEFAULT_INFOBOX}
                                    onChange={(newData) => handleInfoboxChange(block.id, newData)}
                                    namespace={canonicalNamespace}
                                />
                            ) : (
                                <WikiEditor
                                    id={block.id}
                                    value={block.value || emptyValue()}
                                    onValueChange={handleBlockValueChange}
                                    isActive={activeId === block.id}
                                    onFocus={handleFocusChange}
                                    onMount={registerEditor}
                                    onUnmount={unregisterEditor}
                                    onDelete={handleDeleteBlock}
                                />
                            )}
                        </div>
                    ))}
                </ReactGridLayout>
            </div>
        </div>
    );
}