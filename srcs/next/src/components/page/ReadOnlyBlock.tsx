"use client";

import { useMemo } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { renderElement, renderLeaf } from "%/lib/slate_renderer";

const defaultValue: Descendant[] = [
    { type: "paragraph", children: [{ text: "" }] }
];

export default function ReadOnlyBlock({ value }: { value?: Descendant[] }) {
    const editor = useMemo(() => withReact(createEditor()), []);
    const validValue = (value && value.length > 0) ? value : defaultValue;

    return (
        <div className="h-full w-full bg-transparent p-2">
            <Slate key={JSON.stringify(validValue)} editor={editor} initialValue={validValue}>
                <Editable
                    readOnly
                    className="outline-none w-full h-full"
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                />
            </Slate>
        </div>
    );
}