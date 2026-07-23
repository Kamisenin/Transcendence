"use client";

import { useState, useRef, useEffect } from "react";
import { Transforms } from "slate";
import { ReactEditor, useSelected, useFocused, useSlate } from "slate-react";
import { Trash2, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Upload, Check, Pencil, Move, GripVertical,
    ArrowUp, ArrowDown } from "lucide-react";

const MIN_WIDTH = 120;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 400;

const SIZE_PRESETS = [
    { label: "S", value: 240 },
    { label: "M", value: 400 },
    { label: "L", value: 600 },
    { label: "XL", value: 900 },
];

export default function ImageElement({ attributes, children, element }: any) {
    const selected = useSelected();
    const focused = useFocused();
    const editor = useSlate();

    const savedUrl = element.url || "";
    const alt = element.alt || "";
    const align = element.align || "center";
    const savedWidth = element.width || DEFAULT_WIDTH;

    const [tempUrl, setTempUrl] = useState(savedUrl);
    const [hasError, setHasError] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // width
    const [width, setWidth] = useState<number>(savedWidth);
    const [isResizing, setIsResizing] = useState(false);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, width: savedWidth });
    const widthRef = useRef(savedWidth);

    useEffect(() => {
        if (!isDragging.current) setWidth(savedWidth);
    }, [savedWidth]);

    // Positioning
    const getLayoutClasses = () => {
        switch (align) {
            case "left":
                return "float-left mr-4 mb-2"; // Image à gauche, texte à droite
            case "right":
                return "float-right ml-4 mb-2"; // Image à droite, texte à gauche
            default:
                return "mx-auto my-4 clear-both"; // Centré (bloque le texte à côté)
        }
    };

    const updateElement = (fields: Partial<typeof element>) => {
        const path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, fields, { at: path });
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isDragging.current) return;

        const delta = e.clientX - dragStart.current.x;
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStart.current.width + delta));

        widthRef.current = next;
        setWidth(next);
    };

    const handleResizeEnd = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        setIsResizing(false);
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
        updateElement({ width: widthRef.current });
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        setIsResizing(true);
        dragStart.current = { x: e.clientX, width };
        widthRef.current = width;
        document.addEventListener("mousemove", handleResizeMove);
        document.addEventListener("mouseup", handleResizeEnd);
    };

    const applyPresetWidth = (value: number) => {
        setWidth(value);
        updateElement({ width: value });
    };

    const deleteImage = () => {
        const path = ReactEditor.findPath(editor, element);
        Transforms.removeNodes(editor, { at: path });
    };

    const handleConfirmUrl = () => {
        if (!tempUrl.trim()) return;
        setHasError(false);
        setIsEditing(false);
        updateElement({ url: tempUrl.trim() });
    };

    const handleImageError = () => {
        setHasError(true);
        updateElement({ url: "" });
    };

    // const handleDragStart = (e: React.DragEvent) => {
    //     e.stopPropagation()
    //     const path = ReactEditor.findPath(editor, element);
    //     e.dataTransfer.setData("application/slate-image-path", JSON.stringify(path));
    //     e.dataTransfer.effectAllowed = "move";
    // };

    const moveUp = () => {
        try {
            const path = ReactEditor.findPath(editor, element);
            const currentIndex = path[0];
            if (currentIndex > 0) {
                Transforms.moveNodes(editor, {
                    at: path,
                    to: [currentIndex - 1],
                });
            }
        } catch (e) {
            console.warn("Impossible de monter l'image", e);
        }
    };

    const moveDown = () => {
        try {
            const path = ReactEditor.findPath(editor, element);
            const currentIndex = path[0];
            const totalChildren = editor.children.length;

            if (currentIndex < totalChildren - 1) {
                Transforms.moveNodes(editor, {
                    at: path,
                    to: [currentIndex + 1],
                });
            } else {
                // Si l'image est tout en bas, on insère un nouveau paragraphe puis on descend l'image
                Transforms.insertNodes(
                    editor,
                    { type: "paragraph", children: [{ text: "" }] } as any,
                    { at: [totalChildren] }
                );
                Transforms.moveNodes(editor, {
                    at: path,
                    to: [currentIndex + 1],
                });
            }
        } catch (e) {
            console.warn("Impossible de descendre l'image", e);
        }
    };

    return (
        <div {...attributes} contentEditable={false} className={`user-select-none ${getLayoutClasses()}`}>
            <div style={{ width: `${width}px`, maxWidth: "100%", boxSizing: "border-box" }}>
                {savedUrl && !hasError && !isEditing ? (
                    /* Image */
                    <div className={`relative group border-2 rounded-lg overflow-hidden ${selected && focused ? "border-blue-500 shadow-md" : "border-transparent"}`}>
                        {/*
                    //         draggable
                    //         onDragStart={handleDragStart}
                    //         onMouseDown={(e) => e.stopPropagation()}
                    //         className="absolute top-2 left-2 bg-white/90 backdrop-blur border rounded-lg shadow p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20 text-gray-500 hover:text-gray-800"
                    //         title="Maintenir et glisser pour déplacer l'image"
                    //     >
                    //         <GripVertical size={14} />
                    //     </div> */}
                        <img
                            src={savedUrl}
                            alt={alt}
                            onError={handleImageError}
                            className="w-full h-auto object-cover max-h-96 rounded-md pointer-events-none"
                        />

                        {/* Image Toolbar */}

                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur border rounded-lg shadow p-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                                type="button"
                                onClick={moveUp}
                                className="p-1 hover:bg-gray-100 text-gray-600 rounded"
                                title="Monter l'image"
                            >
                                <ArrowUp size={14} />
                            </button>

                            <button
                                type="button"
                                onClick={moveDown}
                                className="p-1 hover:bg-gray-100 text-gray-600 rounded"
                                title="Descendre l'image"
                            >
                                <ArrowDown size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setTempUrl(savedUrl); setIsEditing(true); }}
                                className="p-1 hover:bg-gray-100 text-gray-600 rounded"
                                title="Modifier l'URL"
                            >
                                <Pencil size={14} />
                            </button>

                            <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />

                            {/* Image placement */}
                            <button type="button" onClick={() => updateElement({ align: "left" })} className={`p-1 rounded ${align === "left" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"}`} title="Aligner à gauche (Texte à droite)">
                                <AlignLeft size={14} />
                            </button>
                            <button type="button" onClick={() => updateElement({ align: "center" })} className={`p-1 rounded ${align === "center" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"}`} title="Centrer">
                                <AlignCenter size={14} />
                            </button>
                            <button type="button" onClick={() => updateElement({ align: "right" })} className={`p-1 rounded ${align === "right" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"}`} title="Aligner à droite (Texte à gauche)">
                                <AlignRight size={14} />
                            </button>

                            <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />

                            {/* size preset */}
                            {SIZE_PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => applyPresetWidth(preset.value)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${Math.abs(width - preset.value) < 10 ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600"}`}
                                    title={`Taille ${preset.label} (${preset.value}px)`}
                                >
                                    {preset.label}
                                </button>
                            ))}

                            <div className="w-[1px] h-4 bg-gray-200 mx-0.5" />

                            <button type="button" onClick={deleteImage} className="p-1 hover:bg-red-50 text-red-500 rounded" title="Supprimer">
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* resize button */}
                        <div
                            onMouseDown={handleResizeStart}
                            className="absolute bottom-1 right-1 w-4 h-4 rounded-sm bg-blue-500 border-2 border-white shadow cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
                            title="Glisser pour redimensionner"
                        >
                            <Move size={9} className="text-white" />
                        </div>

                        {/* width indcator */}
                        {isResizing && (
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded z-20">
                                {Math.round(width)}px
                            </div>
                        )}
                    </div>
                ) : (
                    /* Editing form */
                    <div className={`p-4 border-2 border-dashed rounded-xl bg-gray-50 flex flex-col gap-3 min-w-[300px] ${selected && focused ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"}`}>
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                            <span className="flex items-center gap-1.5"><ImageIcon size={14} /> {isEditing ? "Modifier l'image" : "Ajouter une image"}</span>
                            <button type="button" onClick={deleteImage} className="text-red-500 hover:text-red-700">Supprimer</button>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Coller l'URL de l'image..."
                                    value={tempUrl}
                                    onChange={(e) => {
                                        setTempUrl(e.target.value);
                                        if (hasError) setHasError(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleConfirmUrl();
                                        }
                                    }}
                                    className={`text-xs p-2 bg-white border rounded-lg outline-none flex-1 ${hasError ? "border-red-400 focus:border-red-500" : "focus:border-blue-500"}`}
                                />
                                <button
                                    type="button"
                                    onClick={handleConfirmUrl}
                                    className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center justify-center transition"
                                >
                                    <Check size={14} />
                                </button>
                            </div>

                            {hasError && (
                                <span className="text-[11px] text-red-500 font-medium pl-1">
                                    image not found
                                </span>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Nom / Texte alternatif (optionnel)"
                            value={alt}
                            onChange={(e) => updateElement({ alt: e.target.value })}
                            className="text-xs p-2 bg-white border rounded-lg outline-none focus:border-blue-500"
                        />
                        {/* TODO upload */}
                        <div className="border border-dashed border-gray-200 bg-white rounded-lg p-3 text-center opacity-60 cursor-not-allowed">
                            <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                                <Upload size={12} /> Glisser un fichier ou parcourir (Bientôt disponible)
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}