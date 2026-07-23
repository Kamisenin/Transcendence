"use client";

import { useMemo, useEffect, useCallback, useState } from "react";
import { createEditor, Editor, BaseEditor, Descendant, Transforms, Element as SlateElement } from "slate";
import { Slate, Editable, withReact, ReactEditor, useSelected } from "slate-react";
import { withHistory, HistoryEditor } from "slate-history";
import { GripVertical, Trash2 } from "lucide-react";
import ImageElement from "./ImageElement";
import { EditorDragProvider, useEditorDrag } from "@/components/context/EditorDragContext";

type CustomElement = { type: "paragraph"; children: CustomText[] };
type CustomText = { text: string };

declare module "slate" {
    interface CustomTypes {

        Editor: BaseEditor & ReactEditor & HistoryEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

type EditorInstance = BaseEditor & ReactEditor;

type Props = {
    id: string;
    isActive: boolean;
    onFocus: (id: string) => void;
    onMount: (id: string, editor: EditorInstance) => void;
    onUnmount: (id: string) => void;
    onDelete?: (id: string) => void;
    onChange?: () => void;
    onAction?: () => void;
};

export default function WikiEditor({ id, isActive, onFocus, onMount, onUnmount, onDelete, onChange, onAction }: Props) {

    const editor = useMemo(() => {
        const e = withHistory(withReact(createEditor()));
        const { isVoid } = e;
        e.isVoid = (element: any) => (element.type === "image" ? true : isVoid(element));
        return e;
    }, []);


    const initialValue = useMemo<Descendant[]>(
        () => [{ type: "paragraph", children: [{ text: "" }] }],
        []
    );

    useEffect(() => {
        onMount(id, editor);
        return () => onUnmount(id);
    }, [id, editor, onMount, onUnmount]);

    const renderElement = useCallback((props: any) => {
            if (props.element.type === "image") {
                return <ImageElement {...props} />;
            }
            return (
                <p {...props.attributes} className="min-h-[1.5em] my-1 outline-none">
                    {props.children}
                </p>
            );
        }, []);

    const renderLeaf = useCallback((props: any) => {
        const style: React.CSSProperties = {
            fontSize: props.leaf.fontSize || "16px",
            color: props.leaf.color || "#000000",
        };

        let el = <span {...props.attributes} style={style}>{props.children}</span>;
        if (props.leaf.bold) el = <strong>{el}</strong>;
        if (props.leaf.italic) el = <em>{el}</em>;
        if (props.leaf.underline) el = <u>{el}</u>;
        if (props.leaf.strikethrough) el = <s>{el}</s>;

        return el;
    }, []);

    const toggleMark = (mark: string) => {
        const marks = Editor.marks(editor);
        const isActive = marks ? marks[mark] === true : false;

        if (isActive) {
            Editor.removeMark(editor, mark);
        } else {
            Editor.addMark(editor, mark, true);
        }

        // follow action to parent
        if (onAction) {
            onAction();
        }
    };

    const keyHandler =  (event : any) => {
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
                case 'u' :
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
    }


    return (
        <div
            className={[
                "group relative h-full rounded border bg-white p-2 transition shadow-sm overflow-x-auto max-w-full",
                isActive
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-gray-300"
            ].join(" ")}
            onMouseDown={() => onFocus(id)}
        >
            <div className="absolute left-2 top-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 text-gray-400"
                >
                    <GripVertical size={14} />
                </button>
                {onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(id)}
                        className="p-1 rounded hover:bg-red-50 text-red-400"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            <div className="pl-8 h-full">
                <Slate editor={editor} initialValue={initialValue}>
                    <Editable
                        className="w-full h-full p-2 outline-none"
                        placeholder="Type your text here..."
                        onFocus={() => onFocus(id)}
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        onKeyDown={(event) => {
                            keyHandler(event);
                        }}
                    />
                </Slate>
            </div>
        </div>
    );
}