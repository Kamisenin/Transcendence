"use client";

import { useMemo, useEffect } from "react";
import { createEditor, Editor, BaseEditor, Descendant } from "slate";
import { Slate, Editable, withReact, ReactEditor } from "slate-react";
import { withHistory, HistoryEditor } from "slate-history";
import { GripVertical, Trash2 } from "lucide-react";
import { renderElement, renderLeaf } from "%/lib/slate_renderer";
import { useTranslations } from "next-intl";

export type EditorInstance = BaseEditor & ReactEditor & HistoryEditor;
type CustomElement = { type: "paragraph"; children: CustomText[] };
type CustomText = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
}

declare module "slate" {
    interface CustomTypes {
        Editor: EditorInstance;
        Element: CustomElement;
        Text: CustomText;
    }
}

type Props = {
    id: string;
    isActive: boolean;
    value: Descendant[];
    onValueChange: (id: string, value: Descendant[]) => void;
    onFocus: (id: string) => void;
    onMount: (id: string, editor: EditorInstance) => void;
    onUnmount: (id: string) => void;
    onDelete?: (id: string) => void;
    onChange?: () => void;
};

export default function WikiEditor({ id, value, onValueChange, isActive, onFocus, onMount, onUnmount, onDelete }: Props) {
    const t = useTranslations("Page.editor");

    const editor = useMemo(() => {
        const e = withHistory(withReact(createEditor()));
        const { isVoid } = e;
        e.isVoid = (element: any) => (element.type === "image" ? true : isVoid(element));
        return e;
    }, []);

    useEffect(() => {
        onMount(id, editor);
        return () => onUnmount(id);
    }, [id, editor, onMount, onUnmount]);

    const toggleMark = (mark: keyof Omit<CustomText, "text">) => {
        const marks = Editor.marks(editor);
        const isMarkActive = marks ? marks[mark] === true : false;

        if (isMarkActive) {
            Editor.removeMark(editor, mark);
        } else {
            Editor.addMark(editor, mark, true);
        }
    };

    const keyHandler = (event: any) => {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case 'b':
                    event.preventDefault();
                    toggleMark('bold');
                    break;
                case 'i':
                    event.preventDefault();
                    toggleMark('italic');
                    break;
                case 'u':
                    event.preventDefault();
                    toggleMark('underline');
                    break;
                case 'x':
                    if (event.shiftKey) {
                        event.preventDefault();
                        toggleMark('strikethrough');
                        break;
                    }
            }
        }
    };

    return (
        <div
            className={[
                "group relative h-full rounded border bg-[#fffaf7] p-3 transition shadow-sm overflow-x-auto max-w-full flex flex-col",
                isActive
                    ? "border-[#800000] ring-2 ring-[#ead7d0]"
                    : "border-[#d9bfb7] hover:border-[#a98275]"
            ].join(" ")}
        >
            <div className="absolute left-2 top-2 z-10 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#fffaf7]/90 backdrop-blur-sm rounded border border-[#ead7d0] shadow-xs p-0.5">
                <button
                    type="button"
                    className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#f7e9e2] text-[#a89088]"
                    title={t("moveBlock")}
                >
                    <GripVertical size={14} />
                </button>
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(id);
                        }}
                        className="p-1 rounded hover:bg-[#fff1ef] text-[#c26b5f] hover:text-[#a33a2b] transition"
                        title={t("deleteBlock")}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            <div className="pl-9 h-full flex flex-col justify-center " onMouseDown={(e) => e.stopPropagation()}>
                <Slate
                    editor={editor}
                    initialValue={value}
                    onChange={(newValue) => {
                        onValueChange(id, newValue);
                    }}
                >
                    <Editable
                        className="slate-editor-content w-full h-full outline-none text-[#3f2924] leading-normal"
                        placeholder={t("typeHere")}
                        onFocus={() => onFocus(id)}
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        onKeyDown={(event) => {
                            keyHandler(event);
                        }}
                    /> {/* TODO LANGUAGE PLACEHOLDER*/}
                </Slate>
            </div>
        </div>
    );
}
