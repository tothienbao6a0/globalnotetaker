import React, { forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered,
  Quote,
  Type,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
}

export interface RichEditorRef {
  focus: () => void;
  getHTML: () => string;
  setHTML: (html: string) => void;
}

export const RichEditor = forwardRef<RichEditorRef, RichEditorProps>(
  ({ content, onChange, onKeyDown, placeholder = "Start typing your note...", className }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        TextStyle,
        Color,
        FontFamily,
      ],
      content: content || '',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange(html);
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none',
            'focus:outline-none',
            'text-base leading-relaxed',
            'min-h-[120px] p-0',
            className
          ),
          style: `font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`,
        },
        handleKeyDown: (view, event) => {
          if (onKeyDown) {
            onKeyDown(event);
          }
          return false;
        },
      },
    });

    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.commands.focus();
      },
      getHTML: () => {
        return editor?.getHTML() || '';
      },
      setHTML: (html: string) => {
        if (editor) {
          editor.commands.setContent(html);
          // Force a content update
          const currentHtml = editor.getHTML();
          console.log('🔍 RichEditor setHTML called with:', html, 'current content after:', currentHtml);
        }
      },
    }));

    // Update content when prop changes
    React.useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    if (!editor) {
      return null;
    }

    return (
      <div className="w-full h-full flex flex-col">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-neutral-200/50 dark:border-neutral-700/50 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-t-lg">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('bold') && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (⌘B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('italic') && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (⌘I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('strike') && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('bulletList') && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('orderedList') && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('blockquote') && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          {/* Heading buttons */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('heading', { level: 1 }) && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            H1
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700",
              editor.isActive('heading', { level: 2 }) && "bg-neutral-200 dark:bg-neutral-700"
            )}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            H2
          </Button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          <EditorContent 
            editor={editor}
            className="w-full h-full"
            style={{ minHeight: '120px' }}
          />
        </div>
      </div>
    );
  }
);

RichEditor.displayName = 'RichEditor'; 