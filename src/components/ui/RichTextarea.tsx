import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, Strikethrough, List, ListOrdered, Link2, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RichTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  useNativeTextarea?: boolean; // Kept for backwards compatibility if needed, though ignored here
}

const ToolbarButton = ({ icon, onClick, label, isActive }: { icon: React.ReactNode, onClick: () => void, label: string, isActive?: boolean }) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`p-1.5 rounded transition-colors select-none flex items-center justify-center ${isActive ? 'bg-gray-700 text-[#fec312]' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
    aria-label={label}
    title={label}
  >
    {icon}
  </button>
);

const LineBreakCharacterCount = CharacterCount.extend({
  onBeforeCreate() {
    this.storage.characters = (options?: { node?: any; mode?: 'textSize' | 'nodeSize' }) => {
      const node = options?.node || this.editor.state.doc;
      const text = node.textBetween(0, node.content.size, '\n');
      return text.length;
    };
    this.storage.words = (options?: { node?: any }) => {
      const node = options?.node || this.editor.state.doc;
      const text = node.textBetween(0, node.content.size, ' ', ' ');
      return this.options.wordCounter(text);
    };
  }
});

const BUBBLE_MENU_OPTIONS = { placement: 'top' as const };

export const RichTextarea = React.forwardRef<HTMLTextAreaElement, RichTextareaProps>(
  ({ className, value, onChange, placeholder, maxLength, onSelect, onMouseUp, onKeyUp, onScroll, onBlur, ...props }, _ref) => {
    
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [, setUpdateCount] = useState(0);
    const lastPropagatedValue = useRef<string | undefined>(value as string);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
          code: false,
          bold: { HTMLAttributes: { class: 'font-bold' } },
          italic: { HTMLAttributes: { class: 'italic' } },
          strike: { HTMLAttributes: { class: 'line-through' } },
          bulletList: { HTMLAttributes: { class: 'list-disc pl-5 my-1 space-y-1' } },
          orderedList: { HTMLAttributes: { class: 'list-decimal pl-5 my-1 space-y-1' } },
          listItem: { HTMLAttributes: { class: 'leading-normal' } }
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          protocols: ['http', 'https', 'mailto'],
          HTMLAttributes: {
            class: 'text-primary underline hover:opacity-80',
            rel: 'noopener noreferrer',
            target: '_blank',
          },
          validate: href => /^https?:\/\//.test(href) || href.startsWith('mailto:'),
        }),
        Placeholder.configure({
          placeholder: placeholder || 'Type here...',
          emptyEditorClass: 'is-editor-empty',
        }),
        ...(maxLength ? [LineBreakCharacterCount.configure({ limit: maxLength })] : []),
        Markdown.configure({
          html: false, // Do not allow HTML inside markdown
          transformPastedText: true,
          transformCopiedText: true,
        }),
      ],
      content: value as string || '',
      editorProps: {
        attributes: {
          class: cn(
            "flex-col min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 pt-2 pb-3 ring-offset-white focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all font-sans text-sm outline-none",
            "[&_p]:my-1 [&_p:first-child]:mt-0 [&_a]:text-primary [&_a]:underline [&_a:hover]:opacity-80 [&_strong]:font-bold [&_em]:italic [&_s]:line-through [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:leading-normal",
            className
          ),
          ...props as any,
        },
      },
      onTransaction: () => {
        // Force re-render on selection or mark changes so BubbleMenu updates live
        setUpdateCount(c => c + 1);
      },
      onUpdate: ({ editor }) => {
        // Tiptap's tiptap-markdown extension adds getMarkdown()
        const markdown = (editor.storage as any).markdown.getMarkdown();
        if (onChange) {
          lastPropagatedValue.current = markdown;
          // Dispatch a synthetic event to match the textarea API
          // Note: Adapter explicitly maps Tiptap's content -> Markdown -> onChange(e.target.value)
          onChange({
            target: { value: markdown }
          } as React.ChangeEvent<HTMLTextAreaElement>);
        }
      },
      onBlur: (props) => {
        if (onBlur) {
          onBlur(props.event as any);
        }
      }
    });

    // Sync external value changes into the editor (e.g. form resets)
    useEffect(() => {
      if (editor && value !== undefined && value !== lastPropagatedValue.current) {
        lastPropagatedValue.current = value as string;
        editor.commands.setContent(value as string);
      }
    }, [value, editor]);

    if (!editor) {
      return null;
    }

    const setLink = () => {
      if (linkUrl) {
        let finalUrl = linkUrl;
        if (!finalUrl.match(/^[a-zA-Z]+:/) && !finalUrl.startsWith('/')) {
            finalUrl = 'https://' + finalUrl;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
      } else {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      setShowLinkInput(false);
      setLinkUrl('');
    };

    return (
      <div className="relative w-full h-full tiptap-wrapper">
        <BubbleMenu
          editor={editor}
          options={BUBBLE_MENU_OPTIONS}
          className="flex items-center bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden py-1 px-1 pointer-events-auto"
        >
          {showLinkInput ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <input
                type="url"
                autoFocus
                placeholder="Enter link URL..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setLink();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowLinkInput(false);
                  }
                }}
                className="bg-transparent text-sm text-white placeholder:text-gray-400 outline-none w-48 min-w-0"
              />
              <div className="flex items-center gap-1 border-l border-gray-700 pl-2 ml-1">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(false); }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setLink(); }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors text-blue-400 hover:text-blue-300"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <ToolbarButton
                icon={<Bold className="w-4 h-4" />}
                onClick={() => editor.chain().focus().toggleBold().run()}
                label="Bold"
                isActive={editor.isActive('bold')}
              />
              <ToolbarButton
                icon={<Italic className="w-4 h-4" />}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                label="Italic"
                isActive={editor.isActive('italic')}
              />
              <ToolbarButton
                icon={<Strikethrough className="w-4 h-4" />}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                label="Strikethrough"
                isActive={editor.isActive('strike')}
              />
              <div className="w-px h-4 bg-gray-700 mx-1" />
              <ToolbarButton
                icon={<Link2 className="w-4 h-4" />}
                onClick={() => {
                  const previousUrl = editor.getAttributes('link').href;
                  setLinkUrl(previousUrl || '');
                  setShowLinkInput(true);
                }}
                label="Link"
                isActive={editor.isActive('link')}
              />
              <div className="w-px h-4 bg-gray-700 mx-1" />
              <ToolbarButton
                icon={<List className="w-4 h-4" />}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                label="Bullet List"
                isActive={editor.isActive('bulletList')}
              />
              <ToolbarButton
                icon={<ListOrdered className="w-4 h-4" />}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                label="Numbered List"
                isActive={editor.isActive('orderedList')}
              />
            </>
          )}
        </BubbleMenu>

        <EditorContent editor={editor} className="h-full w-full" />
        
        {maxLength && (
          <div className={`absolute bottom-3 right-6 text-[10px] transition-colors font-medium pointer-events-none ${editor.storage.characterCount.characters() >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {editor.storage.characterCount.characters()} / {maxLength}
          </div>
        )}
      </div>
    );
  }
);

RichTextarea.displayName = 'RichTextarea';
