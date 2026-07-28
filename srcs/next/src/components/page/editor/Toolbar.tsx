"use client";

import { Editor, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Bold, Italic, Strikethrough, Underline, Plus, Minus, Type, ChevronDown, PlusCircle, Image as ImageIcon,
 Undo, Redo } from "lucide-react";


type EditorInstance = Editor & ReactEditor;

type Props = {
    editor: EditorInstance | null;
    disabled: boolean;
    onAddBlock?: () => void;
};

export type ToolbarRef = {
    refresh: () => void;
};

const PRESET_SIZES = ["12", "14", "16", "18", "24", "32", "48"];
const COLORS = [
    { name: "Noir", value: "#000000" },
    { name: "Gris", value: "#4b5563" },
    { name: "Rouge", value: "#ef4444" },
    { name: "Bleu", value: "#3b82f6" },
    { name: "Vert", value: "#10b981" },
    { name: "Orange", value: "#f97316" }
];

const Toolbar = forwardRef<ToolbarRef, Props>(({ editor, disabled, onAddBlock }, ref) => {
    const [currentSize, setCurrentSize] = useState("16");
    const [currentColor, setCurrentColor] = useState("#000000");
    disabled = disabled ?? true;

    const [, setTick] = useState(0);
    const refresh = () => setTick(t => t + 1);

    useImperativeHandle(ref, () => ({
        refresh,
    }));

    useEffect(() => {
        if (!editor) return;

        const marks = Editor.marks(editor) as any;
        if (marks && marks.fontSize) {
            setCurrentSize(marks.fontSize.replace("px", "") || "16");
            setCurrentColor(marks.color || "#000000");
        }
    }, [editor, editor?.selection]);

    const isMarkActive = (format: string) => {
        if (!editor) return false;
        const marks = Editor.marks(editor) as Record<string, any> | null;
        return marks ? marks[format] === true : false;
    };

    const toggleMark = (format: string) => {
        if (!editor) return;
        if (isMarkActive(format)) {
            Editor.removeMark(editor, format);
        } else {
            Editor.addMark(editor, format, true);
        }
        ReactEditor.focus(editor);
        refresh();
    };

    const applyFontSize = (numericSizeStr: string) => {
        if (!editor) return;
        const num = parseInt(numericSizeStr) || 16;
        const cleanSize = `${num}px`;
        setCurrentSize(String(num));
        Editor.addMark(editor, "fontSize", cleanSize);
        ReactEditor.focus(editor);
    };

    const changeSizeOffset = (offset: number) => {
        const currentNumeric = parseInt(currentSize) || 16;
        const newSize = Math.max(8, currentNumeric + offset);
        applyFontSize(String(newSize));
    };

    const applyColor = (colorValue: string) => {
        if (!editor) return;
        setCurrentColor(colorValue);
        Editor.addMark(editor, "color", colorValue);
        ReactEditor.focus(editor);
    };

    const insertImage = () => {
        if (!editor) return;

        const imageNode: any = {
            type: "image",
            url: "",
            alt: "",
            align: "center",
            children: [{ text: "" }],
        };

        const paragraphNode: any = {
            type: "paragraph",
            children: [{ text: "" }],
        };

        Transforms.insertNodes(editor, [imageNode, paragraphNode]);
        ReactEditor.focus(editor);
    };

    const handleUndo = () => {
        if (editor) editor.undo();
    };

    const handleRedo = () => {
        if (editor) editor.redo();
    };

    const btnClass = (active: boolean) => [
        "p-1.5 rounded transition",
        active
            ? "bg-blue-50 text-blue-600 border border-blue-200 font-semibold shadow-inner"
            : "text-gray-600 hover:bg-gray-100 border border-transparent"
    ].join(" ");

    return (
        <div
            className={[
                "sticky top-17 mx-auto my-4 z-40 flex flex-wrap items-center gap-2 bg-white border rounded-xl shadow-md px-4 py-1.5 transition-all max-w-max",
                disabled ? "opacity-0 pointer-events-none translate-y-[-10px]" : "opacity-100 translate-y-0"
            ].join(" ")}
        >
            {onAddBlock && (
                <>
                    <button
                        type="button"
                        onClick={onAddBlock}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold border border-blue-200 transition"
                        title="Ajouter un bloc"
                    >
                        <PlusCircle size={15} />
                        <span>Bloc</span>
                    </button>
                    <div className="h-6 w-[1px] bg-gray-200 mx-0.5" />
                </>
            )}

            {/* STYLES DE BASE */}
            <button type="button" onClick={() => toggleMark("bold")} className={btnClass(isMarkActive("bold"))} title="Gras">
                <Bold size={16} />
            </button>
            <button type="button" onClick={() => toggleMark("italic")} className={btnClass(isMarkActive("italic"))} title="Italique">
                <Italic size={16} />
            </button>
            <button type="button" onClick={() => toggleMark("underline")} className={btnClass(isMarkActive("underline"))} title="Souligné">
                <Underline size={16} />
            </button>
            <button type="button" onClick={() => toggleMark("strikethrough")} className={btnClass(isMarkActive("strikethrough"))} title="Barré">
                <Strikethrough size={16} />
            </button>

            <div className="h-6 w-[1px] bg-gray-200 mx-0.5" />

            <button
                type="button"
                onClick={insertImage}
                className="p-1.5 rounded text-gray-600 hover:bg-gray-100 border border-transparent transition"
                title="Insérer une image"
            >
                <ImageIcon size={16} />
            </button>

            <div className="h-6 w-[1px] bg-gray-200 mx-0.5" />

            <div className="flex items-center bg-gray-50 border rounded-lg pl-2 p-0.5 relative group/select">
                {/* Input d'écriture */}
                <input
                    type="text"
                    value={currentSize}
                    onChange={(e) => setCurrentSize(e.target.value.replace(/\D/g, ''))} // Interdit tout sauf les chiffres
                    onBlur={(e) => applyFontSize(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFontSize((e.target as HTMLInputElement).value)}
                    className="w-7 text-center text-xs bg-transparent border-none outline-none font-semibold text-gray-700 select-all"
                />

                <span className="text-[10px] text-gray-400 font-medium pr-1 select-none">px</span>

                <div className="relative flex items-center pr-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <ChevronDown size={12} />
                    <select
                        value={currentSize}
                        onChange={(e) => applyFontSize(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    >
                        {!PRESET_SIZES.includes(currentSize) && <option value={currentSize}>{currentSize}</option>}
                        {PRESET_SIZES.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                {/* Boutons + / - */}
                <div className="flex flex-col border-l border-gray-200 ml-1">
                    <button
                        type="button"
                        onClick={() => changeSizeOffset(1)}
                        className="p-0.5 hover:bg-gray-200 text-gray-500 rounded-t flex items-center justify-center border-b border-gray-200"
                        style={{ fontSize: '8px', lineHeight: '1' }}
                        title="Augmenter de 1px"
                    >
                        <Plus size={10} />
                    </button>
                    <button
                        type="button"
                        onClick={() => changeSizeOffset(-1)}
                        className="p-0.5 hover:bg-gray-200 text-gray-500 rounded-b flex items-center justify-center"
                        style={{ fontSize: '8px', lineHeight: '1' }}
                        title="Diminuer de 1px"
                    >
                        <Minus size={10} />
                    </button>
                </div>
            </div>

            <div className="h-6 w-[1px] bg-gray-200 mx-0.5" />

            <div className="flex items-center gap-1" title="Couleur d'écriture">
                <Type size={16} style={{ color: currentColor }} className="drop-shadow-sm ml-1" />
                <select
                    value={currentColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="text-xs bg-gray-50 border rounded-lg px-2 py-1 outline-none cursor-pointer font-medium text-gray-600"
                >
                    {COLORS.map(color => (
                        <option key={color.value} value={color.value}>{color.name}</option>
                    ))}
                </select>
            </div>

            <div className="h-6 w-[1px] bg-gray-200 mx-1" />

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={handleUndo}
                    disabled={disabled}
                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded disabled:opacity-40"
                    title="Annuler (Ctrl+Z)"
                >
                    <Undo size={16} />
                </button>
                <button
                    type="button"
                    onClick={handleRedo}
                    disabled={disabled}
                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded disabled:opacity-40"
                    title="Rétablir (Ctrl+Y)"
                >
                    <Redo size={16} />
                </button>
            </div>
        </div>
    );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;