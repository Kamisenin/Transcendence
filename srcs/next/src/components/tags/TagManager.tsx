"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Globe, Loader2 } from "lucide-react";
import { getTagsAction } from "@/actions/tags";
import TagBadge from "./TagBadge";
import { Tag } from "./tagType";
import { InfoboxData } from "../page/Infobox"
import { useTranslations } from "next-intl";

type TagManagerProps = {
    accountId: string;
    pageId: number;
    data: InfoboxData;
    onChange?: (data: InfoboxData) => void;
    onOpenModal: () => void;
};

export default function TagManager({ accountId, pageId, data, onChange, onOpenModal }: TagManagerProps) {
    const t = useTranslations("Tags");
    const tCommon = useTranslations("Common");
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [fetched, setFetched] = useState<Tag[]>([]);
    const [searching, setSearching] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const tags = data.tags || [];
    const namespaces = Array.from(new Set(tags.map((t) => t.namespace).filter((ns): ns is string => Boolean(ns && ns.trim() !== ""))));
    let namespace = "";
    if (data.canonicalNamespace && data.canonicalNamespace !== accountId) {
        namespace = data.canonicalNamespace;
    }

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await getTagsAction(input);
                setFetched(res);
            } finally {
                setSearching(false);
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [input, isOpen]);

    const availableTags = fetched.filter((f) => !tags.some((t) => t.id === f.id));

    const addTag = (tag: Tag) => {
        if (!tags.some((t) => t.id === tag.id) && onChange) {
            onChange({ ...data, tags: [...tags, tag] });
        }
    };

    const removeTag = (id: string) => {
        if (onChange)
            onChange({ ...data, tags: tags.filter((t) => t.id !== id) });
    };

    return (
        <div className="pt-1">
            <label className="mb-1.5 block text-xs font-medium text-[#3f2924]">{tCommon('tags')}</label>
            <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} />
                ))}

                <div className="relative" ref={ref}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-[#c9aaa1] bg-[#f7e9e2] px-2.5 py-0.5 text-xs font-medium text-[#800000] hover:bg-[#ead7d0]"
                    >
                        <Plus size={12} /> {tCommon("tags")}
                    </button>

                    {isOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-60 rounded-xl border border-[#d9bfb7] bg-[#fffaf7] p-2 text-xs shadow-xl">
                            <div className="relative mb-1.5">
                                <input
                                    type="text"
                                    autoFocus
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={tCommon("search")}
                                    className="w-full rounded-lg border border-[#d9bfb7] px-2.5 py-1.5 pr-7 outline-none focus:border-[#800000]"
                                />
                                {searching && <Loader2 size={13} className="absolute right-2 top-2 animate-spin text-[#a89088]" />}
                            </div>

                            <div className="max-h-40 overflow-y-auto space-y-0.5">
                                {availableTags.length > 0 ? (
                                    availableTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => { addTag(tag); setIsOpen(false); setInput(""); }}
                                            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-[#f7e9e2]"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                <span className="font-medium text-[#3f2924]">{tag.name}</span>
                                            </div>
                                            {tag.namespace && <span className="rounded bg-[#f7e9e2] px-1.5 py-0.5 font-mono text-[10px] text-[#8a6b63]">{tag.namespace}</span>}
                                        </button>
                                    ))
                                ) : (
                                    <p className="p-2 text-center text-[11px] italic text-[#a89088]">
                                        {searching ? tCommon("searching") : t("noTagFound")}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); onOpenModal(); }}
                                className="mt-1.5 flex w-full cursor-pointer items-center gap-1 rounded border-t border-[#ead7d0] px-2 py-1 pt-1.5 text-left font-semibold text-[#800000] hover:bg-[#f7e9e2]"
                            >
                                <Plus size={13} /> {t("createModal.title")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {namespaces.length > 0 && (
                <div className="mt-3 border-t border-[#ead7d0] pt-2">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#3f2924]">
                        <Globe size={13} className="text-[#a89088]" />
                        {t("slugNamespace")}
                    </label>
                    <select
                        value={namespace}
                        onChange={(e) => onChange?.({ ...data, canonicalNamespace: e.target.value || null })}
                        className="w-full rounded-lg border border-[#d9bfb7] bg-[#f7e9e2] px-2.5 py-1.5 text-xs outline-none focus:border-[#800000] focus:bg-[#fffaf7]"
                    >
                        <option value="">{t("noneUseAccountOnly")}</option>
                        {namespaces.map((ns) => (
                            <option key={ns} value={ns}>
                                {ns} / [page-title]
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}