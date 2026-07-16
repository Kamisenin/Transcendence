"use client";

import { useState } from "react";
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

type CustomElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string }

declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor
        Element: CustomElement
        Text: CustomText
    }
}

export default function Editor() {
    const [editor] = useState(() => withReact(createEditor()));

    const initialValue = [
        {
            type: 'placeholder',
            children: [{text: ''}],
        },
    ]

    return (
            <Slate editor={editor} initialValue={initialValue}>
                <Editable className="w-full h-full p-4 outline-none" placeholder={"Type Your text here"}/>
            </Slate>
        );
}