import Editor from '@tiptap/react';

export default function Toolbar({editor }: { editor: Editor | null })
{
    if (!editor) return null;

    return (<div className="flex gap-2 p-2 border-b">
        <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'font-bold bg-gray-200' : ''}
        >
            B
        </button>
        <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'italic bg-gray-200' : ''}
        >
            I
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            H1
        </button>
    </div>);
}