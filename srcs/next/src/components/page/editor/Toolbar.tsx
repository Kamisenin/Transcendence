"use client";

import { Editor, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Bold, Italic, Strikethrough, Underline, Plus, Minus, Type, ChevronDown, PlusCircle, Image as ImageIcon,
 Undo, Redo } from "lucide-react";
import { HistoryEditor } from "slate-history";
import { type EditorInstance } from "./WikiEditor"
import { useTranslations } from "next-intl";

type Props = {
    editor: EditorInstance | null;
    disabled: boolean;
    onAddBlock?: () => void;
};

export type ToolbarRef = {
    refresh: () => void;
};

const PRESET_SIZES = ["12", "14", "16", "18", "24", "32", "48"];

const Toolbar = forwardRef<ToolbarRef, Props>(({ editor, disabled, onAddBlock }, ref) => {
    const [currentSize, setCurrentSize] = useState("16");
    const [currentColor, setCurrentColor] = useState("#000000");
    disabled = disabled ?? true;
    const t = useTranslations("Page.editor");

    const COLORS = [
        { name: t("colors.black"), value: "#000000" },
        { name: t("colors.gray"), value: "#4b5563" },
        { name: t("colors.red"), value: "#ef4444" },
        { name: t("colors.blue"), value: "#3b82f6" },
        { name: t("colors.green"), value: "#10b981" },
        { name: t("colors.orange"), value: "#f97316" }
    ];

    const [, setTick] = useState(0);
    const refresh = () => setTick(v => v + 1);

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
            ? "bg-[#f7e9e2] text-[#800000] border border-[#d9bfb7] font-semibold shadow-inner"
            : "text-[#6f4d44] hover:bg-[#f7e9e2] border border-transparent"
    ].join(" ");

    return (
        <div
            className={[
                "sticky top-17 mx-auto my-4 z-40 flex flex-wrap items-center gap-2 bg-[#fffaf7] border border-[#d9bfb7] rounded-xl shadow-md px-4 py-1.5 transition-all max-w-max",
                disabled ? "opacity-0 pointer-events-none translate-y-[-10px]" : "opacity-100 translate-y-0"
            ].join(" ")}
        >
            {onAddBlock && (
                <>
                    <button
                        type="button"
                        onClick={onAddBlock}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f7e9e2] hover:bg-[#ead7d0] text-[#800000] rounded-lg text-xs font-semibold border border-[#d9bfb7] transition"
                        title={t("addBlock")}
                    >
                        <PlusCircle size={15} />
                        <span>{t("block")}</span>
                    </button>
                    <div className="h-6 w-[1px] bg-[#ead7d0] mx-0.5" />
                </>
            )}
            <button type="button" onClick={() => toggleMark("bold")} className={btnClass(isMarkActive("bold"))} title={t("bold")}>
                <Bold size={16} />
            </button>
            <button type="button" onClick={() => toggleMark("italic")} className={btnClass(isMarkActive("italic"))} title={t("italic")}>
                <Italic size={16} />
            </button>
            <button type="button" onClick={() => toggleMark("underline")} className={btnClass(isMarkActive("underline"))} title={t("underline")}>
                <Underline size={16} />
            </button>
            <button type="button" onClick={() => toggleMark("strikethrough")} className={btnClass(isMarkActive("strikethrough"))} title={t("strikethrough")}>
                <Strikethrough size={16} />
            </button>

            <div className="h-6 w-[1px] bg-[#ead7d0] mx-0.5" />

            <button
                type="button"
                onClick={insertImage}
                className="p-1.5 rounded text-[#6f4d44] hover:bg-[#f7e9e2] border border-transparent transition"
                title={t("insertImage")}
            >
                <ImageIcon size={16} />
            </button>

            <div className="h-6 w-[1px] bg-[#ead7d0] mx-0.5" />

            <div className="flex items-center bg-[#f7e9e2] border border-[#d9bfb7] rounded-lg pl-2 p-0.5 relative group/select">
                {/* Input d'écriture */}
                <input
                    type="text"
                    value={currentSize}
                    onChange={(e) => setCurrentSize(e.target.value.replace(/\D/g, ''))} // Interdit tout sauf les chiffres
                    onBlur={(e) => applyFontSize(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFontSize((e.target as HTMLInputElement).value)}
                    className="w-7 text-center text-xs bg-transparent border-none outline-none font-semibold text-[#3f2924] select-all"
                />

                <span className="text-[10px] text-[#a89088] font-medium pr-1 select-none">px</span>

                <div className="relative flex items-center pr-1 text-[#a89088] hover:text-[#6f4d44] cursor-pointer">
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
                <div className="flex flex-col border-l border-[#d9bfb7] ml-1">
                    <button
                        type="button"
                        onClick={() => changeSizeOffset(1)}
                        className="p-0.5 hover:bg-[#ead7d0] text-[#6f4d44] rounded-t flex items-center justify-center border-b border-[#d9bfb7]"
                        style={{ fontSize: '8px', lineHeight: '1' }}
                        title={t("increaseBy1px")}
                    >
                        <Plus size={10} />
                    </button>
                    <button
                        type="button"
                        onClick={() => changeSizeOffset(-1)}
                        className="p-0.5 hover:bg-[#ead7d0] text-[#6f4d44] rounded-b flex items-center justify-center"
                        style={{ fontSize: '8px', lineHeight: '1' }}
                        title={t("decreaseBy1px")}
                    >
                        <Minus size={10} />
                    </button>
                </div>
            </div>

            <div className="h-6 w-[1px] bg-[#ead7d0] mx-0.5" />

            <div className="flex items-center gap-1" title={t("textColor")}>
                <Type size={16} style={{ color: currentColor }} className="drop-shadow-sm ml-1" />
                <select
                    value={currentColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="text-xs bg-[#f7e9e2] border border-[#d9bfb7] rounded-lg px-2 py-1 outline-none cursor-pointer font-medium text-[#6f4d44]"
                >
                    {COLORS.map(color => (
                        <option key={color.value} value={color.value}>{color.name}</option>
                    ))}
                </select>
            </div>

            <div className="h-6 w-[1px] bg-[#ead7d0] mx-1" />

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={handleUndo}
                    disabled={disabled}
                    className="p-1.5 hover:bg-[#f7e9e2] text-[#6f4d44] rounded disabled:opacity-40"
                    title={t("undo")}
                >
                    <Undo size={16} />
                </button>
                <button
                    type="button"
                    onClick={handleRedo}
                    disabled={disabled}
                    className="p-1.5 hover:bg-[#f7e9e2] text-[#6f4d44] rounded disabled:opacity-40"
                    title={t("redo")}
                >
                    <Redo size={16} />
                </button>
            </div>
        </div>
    );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;