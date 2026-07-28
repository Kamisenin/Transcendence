"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import ReadOnlyBlock from '@/components/page/ReadOnlyBlock'
import Infobox, { type InfoboxData } from '@/components/page/Infobox';

const ReactGridLayout = dynamic(
    () => import('react-grid-layout').then((mod) => mod.default || mod),
    { ssr: false }
);

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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

export default function PageViewer({ title, blocks }: { title?: string, blocks: SavedBlock[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(1200);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const layout = blocks.map(b => ({
        i: b.id,
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        static: true
    }));

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
                        <div key={block.id} className="relative bg-white border border-gray-100 shadow-sm rounded overflow-hidden">
                            {block.type === 'infobox' ? (
                                <Infobox
                                    id={block.id}
                                    pageId={0}
                                    data={block.infoboxData || { title: '', imageUrl: '', description: '', tags: [] }}
                                    onChange={() => {}}
                                    isReadOnly={true}
                                />
                            ) : (
                                <div className="p-2">
                                    <ReadOnlyBlock value={block.value || []} />
                                </div>
                            )}
                        </div>
                    ))}
                </ReactGridLayout>
            </div>
        </div>
    );
}