"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ImageExtension from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  Bold,
  CodeXml,
  Columns3,
  Highlighter,
  ImagePlus,
  Italic,
  LayoutTemplate,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Rows3,
  Strikethrough,
  Table,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Trash2,
  Underline,
  Undo2,
  Unlink,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { plainToHtml } from "@/lib/rich-text";

import { uploadImage, type MediaItem } from "./ImageUploader";
import { inputClass, primaryButton, secondaryButton, textareaClass } from "./ui";

export type RichTextTemplate = { label: string; html: () => string };

type Panel = null | "link" | "image";

/**
 * WordPress-style editor for product descriptions. Stores HTML (sanitized again on the server).
 * `variant="compact"` is a lighter toolbar for short texts such as the short description.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  variant = "full",
  minHeight = 260,
  maxChars,
  mediaChoices = [],
  templates = [],
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  variant?: "full" | "compact";
  minHeight?: number;
  maxChars?: number;
  /** Product images offered in the "Insert image" panel */
  mediaChoices?: MediaItem[];
  templates?: RichTextTemplate[];
  invalid?: boolean;
}) {
  const full = variant === "full";
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [source, setSource] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // The last HTML we reported, so outside changes (loading a product) can be told apart
  const lastHtml = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: full ? undefined : false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: null, target: null },
        },
      }),
      Highlight,
      ...(full
        ? [
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            ImageExtension.configure({ inline: false }),
            TableKit.configure({ table: { resizable: true } }),
          ]
        : []),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      CharacterCount.configure({ limit: maxChars ?? null }),
    ],
    content: plainToHtml(value),
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: "rich-text text-sm px-4 py-3",
        style: `min-height:${minHeight}px`,
        role: "textbox",
        "aria-multiline": "true",
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          setPanel("link");
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      lastHtml.current = html;
      onChangeRef.current(html);
    },
  });

  // Content replaced from outside (product loaded, template applied by the parent…)
  useEffect(() => {
    if (!editor || value === lastHtml.current) return;
    lastHtml.current = value;
    editor.commands.setContent(plainToHtml(value), { emitUpdate: false });
    if (mode === "html") setSource(value);
  }, [value, editor, mode]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const switchMode = (next: "visual" | "html") => {
    if (!editor || next === mode) return;
    if (next === "html") {
      setSource(editor.isEmpty ? "" : formatHtml(editor.getHTML()));
      setPanel(null);
    } else {
      editor.commands.setContent(source || "", { emitUpdate: true });
    }
    setMode(next);
  };

  const chars = editor?.storage.characterCount.characters() ?? 0;
  const wordCount = editor?.storage.characterCount.words() ?? 0;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[70] bg-background flex flex-col p-3 sm:p-6"
          : "rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring/40 aria-[invalid=true]:border-destructive"
      }
      aria-invalid={invalid || undefined}
    >
      <div
        className={`rich-text-editor flex flex-col ${fullscreen ? "flex-1 min-h-0 max-w-4xl w-full mx-auto rounded-xl border border-border bg-card" : ""}`}
      >
        <Toolbar
          editor={editor}
          full={full}
          mode={mode}
          panel={panel}
          setPanel={setPanel}
          switchMode={switchMode}
          fullscreen={fullscreen}
          setFullscreen={setFullscreen}
          templates={templates}
        />
        {editor && panel === "link" && mode === "visual" && (
          <LinkPanel editor={editor} onClose={() => setPanel(null)} />
        )}
        {editor && panel === "image" && mode === "visual" && (
          <ImagePanel editor={editor} media={mediaChoices} onClose={() => setPanel(null)} />
        )}
        {editor && mode === "visual" && editor.isActive("image") && <ImageAltBar editor={editor} />}
        {editor && mode === "visual" && editor.isActive("table") && <TableBar editor={editor} />}

        <div className={fullscreen ? "flex-1 overflow-y-auto" : ""}>
          {mode === "visual" ? (
            <EditorContent editor={editor} />
          ) : (
            <textarea
              aria-label="HTML source"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                lastHtml.current = e.target.value;
                onChangeRef.current(e.target.value);
              }}
              spellCheck={false}
              className={`${textareaClass} font-mono text-xs border-0 rounded-none focus:ring-0 block`}
              style={{ minHeight: fullscreen ? "100%" : minHeight }}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          <span>
            {mode === "html"
              ? "Editing HTML — only safe formatting is kept when you save."
              : full
                ? "Tip: Ctrl+K adds a link. Paste from Word or Google Docs keeps headings and lists."
                : "Ctrl+B bold · Ctrl+I italic · Ctrl+K link"}
          </span>
          <span className="tabular-nums">
            {wordCount} word{wordCount === 1 ? "" : "s"} · {chars}
            {maxChars ? ` / ${maxChars}` : ""} characters
            {full && wordCount > 0 && ` · ${Math.max(1, Math.round(wordCount / 200))} min read`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar ───

function Tb({
  label,
  onClick,
  active,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-foreground/80 hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-ring ${active ? "bg-secondary text-primary" : ""}`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />;

const icon = "w-4 h-4";

function Toolbar({
  editor,
  full,
  mode,
  panel,
  setPanel,
  switchMode,
  fullscreen,
  setFullscreen,
  templates,
}: {
  editor: Editor | null;
  full: boolean;
  mode: "visual" | "html";
  panel: Panel;
  setPanel: (p: Panel) => void;
  switchMode: (m: "visual" | "html") => void;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  templates: RichTextTemplate[];
}) {
  const off = !editor || mode === "html";
  const chain = () => editor!.chain().focus();
  const block = !editor
    ? "p"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("heading", { level: 4 })
          ? "h4"
          : "p";

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-border bg-card/95 backdrop-blur px-1.5 py-1"
    >
      <Tb
        label="Undo (Ctrl+Z)"
        onClick={() => chain().undo().run()}
        disabled={off || !editor.can().undo()}
      >
        <Undo2 className={icon} />
      </Tb>
      <Tb
        label="Redo (Ctrl+Shift+Z)"
        onClick={() => chain().redo().run()}
        disabled={off || !editor.can().redo()}
      >
        <Redo2 className={icon} />
      </Tb>
      <Sep />
      {full && (
        <>
          <select
            aria-label="Text style"
            value={block}
            disabled={off}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") chain().setParagraph().run();
              else
                chain()
                  .setHeading({ level: Number(v.slice(1)) as 2 | 3 | 4 })
                  .run();
            }}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs disabled:opacity-40"
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
          <Sep />
        </>
      )}
      <Tb
        label="Bold (Ctrl+B)"
        onClick={() => chain().toggleBold().run()}
        active={editor?.isActive("bold")}
        disabled={off}
      >
        <Bold className={icon} />
      </Tb>
      <Tb
        label="Italic (Ctrl+I)"
        onClick={() => chain().toggleItalic().run()}
        active={editor?.isActive("italic")}
        disabled={off}
      >
        <Italic className={icon} />
      </Tb>
      <Tb
        label="Underline (Ctrl+U)"
        onClick={() => chain().toggleUnderline().run()}
        active={editor?.isActive("underline")}
        disabled={off}
      >
        <Underline className={icon} />
      </Tb>
      <Tb
        label="Strikethrough"
        onClick={() => chain().toggleStrike().run()}
        active={editor?.isActive("strike")}
        disabled={off}
      >
        <Strikethrough className={icon} />
      </Tb>
      <Tb
        label="Highlight"
        onClick={() => chain().toggleHighlight().run()}
        active={editor?.isActive("highlight")}
        disabled={off}
      >
        <Highlighter className={icon} />
      </Tb>
      <Sep />
      <Tb
        label="Bullet list"
        onClick={() => chain().toggleBulletList().run()}
        active={editor?.isActive("bulletList")}
        disabled={off}
      >
        <List className={icon} />
      </Tb>
      <Tb
        label="Numbered list"
        onClick={() => chain().toggleOrderedList().run()}
        active={editor?.isActive("orderedList")}
        disabled={off}
      >
        <ListOrdered className={icon} />
      </Tb>
      {full && (
        <Tb
          label="Quote"
          onClick={() => chain().toggleBlockquote().run()}
          active={editor?.isActive("blockquote")}
          disabled={off}
        >
          <Quote className={icon} />
        </Tb>
      )}
      {full && (
        <>
          <Sep />
          {(
            [
              ["left", "Align left", TextAlignStart],
              ["center", "Align centre", TextAlignCenter],
              ["right", "Align right", TextAlignEnd],
              ["justify", "Justify", TextAlignJustify],
            ] as const
          ).map(([align, label, Icon]) => (
            <Tb
              key={align}
              label={label}
              onClick={() => chain().setTextAlign(align).run()}
              active={editor?.isActive({ textAlign: align })}
              disabled={off}
            >
              <Icon className={icon} />
            </Tb>
          ))}
        </>
      )}
      <Sep />
      <Tb
        label="Link (Ctrl+K)"
        onClick={() => setPanel(panel === "link" ? null : "link")}
        active={editor?.isActive("link") || panel === "link"}
        disabled={off}
      >
        <Link2 className={icon} />
      </Tb>
      {editor?.isActive("link") && (
        <Tb
          label="Remove link"
          onClick={() => chain().extendMarkRange("link").unsetLink().run()}
          disabled={off}
        >
          <Unlink className={icon} />
        </Tb>
      )}
      {full && (
        <>
          <Tb
            label="Insert image"
            onClick={() => setPanel(panel === "image" ? null : "image")}
            active={panel === "image"}
            disabled={off}
          >
            <ImagePlus className={icon} />
          </Tb>
          <Tb
            label="Insert table"
            onClick={() => chain().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
            disabled={off || editor.isActive("table")}
          >
            <Table className={icon} />
          </Tb>
          <Tb label="Divider line" onClick={() => chain().setHorizontalRule().run()} disabled={off}>
            <Minus className={icon} />
          </Tb>
        </>
      )}
      <Tb
        label="Clear formatting"
        onClick={() => chain().unsetAllMarks().clearNodes().run()}
        disabled={off}
      >
        <RemoveFormatting className={icon} />
      </Tb>

      <div className="ml-auto flex items-center gap-0.5">
        {templates.length > 0 && (
          <label
            className="inline-flex items-center gap-1 text-xs"
            title="Insert a ready-made outline"
          >
            <LayoutTemplate className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Insert template</span>
            <select
              value=""
              disabled={off}
              onChange={(e) => {
                const t = templates[Number(e.target.value)];
                if (!t || !editor) return;
                if (!editor.isEmpty && !confirm("Add this outline at the end of the description?"))
                  return;
                if (editor.isEmpty) editor.commands.setContent(t.html(), { emitUpdate: true });
                else chain().insertContentAt(editor.state.doc.content.size, t.html()).run();
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs disabled:opacity-40"
            >
              <option value="">Templates</option>
              {templates.map((t, i) => (
                <option key={t.label} value={i}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {full && (
          <Tb
            label={mode === "html" ? "Back to visual editor" : "Edit HTML"}
            onClick={() => switchMode(mode === "html" ? "visual" : "html")}
            active={mode === "html"}
            disabled={!editor}
          >
            <CodeXml className={icon} />
          </Tb>
        )}
        {full && (
          <Tb
            label={fullscreen ? "Exit full screen (Esc)" : "Full screen"}
            onClick={() => setFullscreen(!fullscreen)}
            disabled={!editor}
          >
            {fullscreen ? <Minimize2 className={icon} /> : <Maximize2 className={icon} />}
          </Tb>
        )}
      </div>
    </div>
  );
}

// ─── Panels ───

const panelClass = "border-b border-border bg-secondary/40 px-3 py-3 space-y-2.5";

function LinkPanel({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = editor.getAttributes("link");
  const [href, setHref] = useState<string>(current.href ?? "");
  const [newTab, setNewTab] = useState(current.target === "_blank");
  const [nofollow, setNofollow] = useState(/nofollow/.test(current.rel ?? ""));
  const uid = useId();

  const apply = () => {
    const url = href.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return onClose();
    }
    const normalized =
      url.startsWith("/") || url.startsWith("#") || /^(https?:|mailto:|tel:)/i.test(url)
        ? url
        : `https://${url}`;
    const rel = [nofollow && "nofollow", newTab && "noopener noreferrer"].filter(Boolean).join(" ");
    const attrs = { href: normalized, target: newTab ? "_blank" : null, rel: rel || null };
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link")) {
      chain.insertContent({ type: "text", text: url, marks: [{ type: "link", attrs }] }).run();
    } else chain.setLink(attrs as any).run();
    onClose();
  };

  return (
    <div className={panelClass}>
      <label htmlFor={`${uid}-href`} className="block text-xs font-medium">
        Link address
      </label>
      <div className="flex gap-2">
        <input
          id={`${uid}-href`}
          autoFocus
          value={href}
          onChange={(e) => setHref(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            } else if (e.key === "Escape") onClose();
          }}
          placeholder="/category/serums  or  https://brand.com"
          className={inputClass}
        />
        <button type="button" onClick={apply} className={`${primaryButton} h-10 shrink-0`}>
          Apply
        </button>
        <button type="button" onClick={onClose} className={`${secondaryButton} h-10 shrink-0`}>
          Cancel
        </button>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
          Open in a new tab
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={nofollow}
            onChange={(e) => setNofollow(e.target.checked)}
          />
          nofollow (for sponsored or untrusted sites)
        </label>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Links to your own categories, brands and products (starting with /) help search engines
        understand the shop.
      </p>
    </div>
  );
}

function ImagePanel({
  editor,
  media,
  onClose,
}: {
  editor: Editor;
  media: MediaItem[];
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const insert = (src: string, altText: string) => {
    editor
      .chain()
      .focus()
      .setImage({ src, alt: altText.trim() || undefined })
      .run();
    onClose();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    setUploading(true);
    try {
      insert(await uploadImage(file, "products"), alt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload the image.");
    } finally {
      setUploading(false);
    }
  };

  const insertUrl = () => {
    try {
      const u = new URL(url.trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      insert(u.toString(), alt);
    } catch {
      toast.error("Paste a full image address starting with https://");
    }
  };

  return (
    <div className={panelClass}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${uid}-alt`} className="block text-xs font-medium">
            Alt text{" "}
            <span className="font-normal text-muted-foreground">
              (describe the image — good for SEO)
            </span>
          </label>
          <input
            id={`${uid}-alt`}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="e.g. Snail mucin essence texture on skin"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${uid}-url`} className="block text-xs font-medium">
            Image address
          </label>
          <div className="flex gap-2">
            <input
              id={`${uid}-url`}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), insertUrl())}
              placeholder="https://"
              className={inputClass}
            />
            <button
              type="button"
              onClick={insertUrl}
              disabled={!url.trim()}
              className={`${secondaryButton} h-10 shrink-0`}
            >
              Insert
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`${primaryButton} h-9`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Upload from computer
        </button>
        <button type="button" onClick={onClose} className={`${secondaryButton} h-9`}>
          Cancel
        </button>
      </div>
      {media.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1.5">Or use one of this product's images</p>
          <div className="flex flex-wrap gap-2">
            {media.map((m) => (
              <button
                key={m.url}
                type="button"
                onClick={() => insert(m.url, alt || m.alt)}
                className="rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary"
                title={m.alt || "Insert this image"}
              >
                <img src={m.url} alt={m.alt} className="w-14 h-14 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImageAltBar({ editor }: { editor: Editor }) {
  const alt: string = editor.getAttributes("image").alt ?? "";
  return (
    <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-2 text-xs">
      <label htmlFor="rte-img-alt" className="font-medium shrink-0">
        Image alt text
      </label>
      <input
        id="rte-img-alt"
        value={alt}
        onChange={(e) => editor.chain().updateAttributes("image", { alt: e.target.value }).run()}
        placeholder="Describe this image for search engines and screen readers"
        className={`${inputClass} h-8`}
      />
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteSelection().run()}
        className={`${secondaryButton} h-8 px-2 shrink-0`}
        aria-label="Remove image"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function TableBar({ editor }: { editor: Editor }) {
  const chain = () => editor.chain().focus();
  const btn = `${secondaryButton} h-7 px-2 text-xs`;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-secondary/40 px-3 py-1.5">
      <span className="text-xs font-medium mr-1">Table:</span>
      <button type="button" className={btn} onClick={() => chain().addRowAfter().run()}>
        <Rows3 className="w-3.5 h-3.5" /> Add row
      </button>
      <button type="button" className={btn} onClick={() => chain().addColumnAfter().run()}>
        <Columns3 className="w-3.5 h-3.5" /> Add column
      </button>
      <button type="button" className={btn} onClick={() => chain().deleteRow().run()}>
        Delete row
      </button>
      <button type="button" className={btn} onClick={() => chain().deleteColumn().run()}>
        Delete column
      </button>
      <button type="button" className={btn} onClick={() => chain().toggleHeaderRow().run()}>
        Header row
      </button>
      <button
        type="button"
        className={`${btn} text-destructive`}
        onClick={() => chain().deleteTable().run()}
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete table
      </button>
    </div>
  );
}

/** Puts each block element on its own line so the HTML view is readable. */
function formatHtml(html: string) {
  return html
    .replace(/(<\/(p|h[1-6]|ul|ol|li|blockquote|table|thead|tbody|tr)>)/g, "$1\n")
    .replace(/(<(ul|ol|table|thead|tbody|tr)>)/g, "$1\n")
    .replace(/<hr>/g, "<hr>\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
