"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Toolbar from '@/components/Toolbar'

export default function WikiEditor() {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
        ],
        placeholder: '<p>Commence à écrire...</p>',
    });

    return (
        <div className={"pt-16 min-h-screen"}>
            <Toolbar editor={editor} />
            <EditorContent className={"min-h-screen"} editor={editor} />
        </div>
    );
}