"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import type { BaseEditor } from 'slate';
import type { ReactEditor } from 'slate-react';
import WikiEditor from "@/components/WikiEditor";
import dynamic from 'next/dynamic'
import { ToolbarRef } from "@/components/Toolbar";

import ReactGridLayout, { type Layout } from 'react-grid-layout';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const Toolbar = dynamic(() => import('@/components/Toolbar'), { ssr: false });

type EditorInstance = BaseEditor & ReactEditor;

type EditorBlock = {
    id: string;
};

export default function Page() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeEditor, setActiveEditor] = useState<EditorInstance | null>(null);

    const toolbarRef = useRef<ToolbarRef>(null);

    const [blocks, setBlocks] = useState<EditorBlock[]>([
        { id: "block-1" },
        { id: "block-2" }
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
        setBlocks(prev => [...prev, { id: newId }]);

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

    const handleEditorChange = () => {
        setEditorStateTick(prev => prev + 1);
        console.log("current :" + editorStateTick)
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pt-20">
            <Toolbar ref={toolbarRef} editor={activeEditor} disabled={!activeEditor} onAddBlock={handleAddBlock} />
            <div
                ref={containerRef}
                className="max-w-6xl mx-auto border rounded-xl bg-white p-4 min-h-[500px] shadow-sm relative"
            >
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