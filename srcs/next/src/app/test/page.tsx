"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import type { BaseEditor } from 'slate';
import type { ReactEditor } from 'slate-react';
import WikiEditor from "@/components/page/editor/WikiEditor";
import { ToolbarRef } from "@/components/page/editor/Toolbar";
import { savePage } from "@/actions/pages";
import dynamic from 'next/dynamic'

import ReactGridLayout, { type Layout } from 'react-grid-layout';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const Toolbar = dynamic(() => import('@/components/page/editor/Toolbar'), { ssr: false });

type EditorInstance = BaseEditor & ReactEditor;

type EditorBlock = {
    id: string;
    value: Descendant[];
};


const emptyValue = (): Descendant[] => [
    { type: "paragraph", children: [{ text: "" }] }
];

function handleBlockValueChange(id: string, value: Descendant[]) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, value } : b));
}

export default function Page() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeEditor, setActiveEditor] = useState<EditorInstance | null>(null);
    const toolbarRef = useRef<ToolbarRef>(null);

    const [blocks, setBlocks] = useState<EditorBlock[]>([
        { id: "block-1", value: [{ type: "paragraph", children: [{ text: "" }] }] },
        { id: "block-2", value: [{ type: "paragraph", children: [{ text: "" }] }] }
    ]);

    const [layout, setLayout] = useState<Layout[]>([
        { i: "block-1", x: 0, y: 0, w: 6, h: 4 },
        { i: "block-2", x: 6, y: 0, w: 6, h: 4 }
    ]);

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

    function registerEditor(id: string, editor: EditorInstance) {
        editors.set(id, editor);
    }

    function unregisterEditor(id: string) {
        editors.delete(id);
        if (activeId === id) {
            setActiveId(null);
            setActiveEditor(null);
        }
    }

    /*-------------------------------------
    * ------------ HANDLERS ---------------
    * -----------------------------------*/

    const handleEditorAction = () => {
        toolbarRef.current?.refresh();
    };

    const handleAddBlock = () => {
        const newId = `block-${Date.now()}`;
        setBlocks(prev => [...prev, { id: newId, value: emptyValue() }]);

        const nextY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
        setLayout(prev => [
            ...prev,
            { i: newId, x: 0, y: nextY, w: 6, h: 4 }
        ]);
    };

    const handleDeleteBlock = (id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
        setLayout(prev => prev.filter(item => item.i !== id));
        unregisterEditor(id);
    };

    function handleFocusChange(id: string) {
        setActiveId(id);
        const editorInstance = editors.get(id);
        if (editorInstance) {
            setActiveEditor(editorInstance);
        }
    }

    function handleBlockValueChange(id: string, value: Descendant[]) {
        setBlocks(prev => prev.map(b => (b.id === id ? { ...b, value } : b)));
    }

    async function handleSave() {
        const content = {
            blocks: blocks.map(block => {
                const layoutItem = layout.find(l => l.i === block.id)!;
                return {
                    id: block.id,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    w: layoutItem.w,
                    h: layoutItem.h,
                    value: block.value,
                };
            }),
        };
        await savePage(pageId, content);
        console.log("À sauvegarder :", content);
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pt-20">
            <Toolbar ref={toolbarRef} editor={activeEditor} disabled={!activeEditor} onAddBlock={handleAddBlock} />
            <button onClick={handleSave} className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold">
                Save
            </button>
            <div ref={containerRef} className="max-w-6xl mx-auto border rounded-xl bg-white p-4 min-h-[500px] shadow-sm relative">
                <ReactGridLayout
                    className="layout"
                    layout={layout}
                    onLayoutChange={(newLayout) => setLayout(newLayout)}
                    cols={12}
                    rowHeight={40}
                    margin={[16, 16]}
                    width={width}
                    draggableHandle=".drag-handle"
                >
                    {blocks.map(block => (
                        <div key={block.id} className="relative group/grid-item">
                            <WikiEditor
                                id={block.id}
                                value={block.value}
                                onValueChange={handleBlockValueChange}
                                isActive={activeId === block.id}
                                onFocus={handleFocusChange}
                                onMount={registerEditor}
                                onUnmount={unregisterEditor}
                                onDelete={handleDeleteBlock}
                                onAction={handleEditorAction}
                            />
                        </div>
                    ))}
                </ReactGridLayout>
            </div>
        </div>
    );
}