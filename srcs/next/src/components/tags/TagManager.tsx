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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} />
                ))}

                <div className="relative" ref={ref}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-dashed border-gray-300 rounded-full cursor-pointer"
                    >
                        <Plus size={12} /> {tCommon("tags")}
                    </button>

                    {isOpen && (
                        <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 text-xs">
                            <div className="relative mb-1.5">
                                <input
                                    type="text"
                                    autoFocus
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={tCommon("search")}
                                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-500 pr-7"
                                />
                                {searching && <Loader2 size={13} className="absolute right-2 top-2 animate-spin text-gray-400" />}
                            </div>

                            <div className="max-h-40 overflow-y-auto space-y-0.5">
                                {availableTags.length > 0 ? (
                                    availableTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => { addTag(tag); setIsOpen(false); setInput(""); }}
                                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                <span className="font-medium text-gray-700">{tag.name}</span>
                                            </div>
                                            {tag.namespace && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{tag.namespace}</span>}
                                        </button>
                                    ))
                                ) : (
                                    <p className="p-2 text-center text-gray-400 italic text-[11px]">
                                        {searching ? tCommon("searching") : t("noTagFound")}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); onOpenModal(); }}
                                className="w-full mt-1.5 pt-1.5 border-t border-gray-100 text-left px-2 py-1 rounded text-blue-600 hover:bg-blue-50 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                                <Plus size={13} /> {t("createModal.title")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {namespaces.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                        <Globe size={13} className="text-gray-400" />
                        {t("slugNamespace")}
                    </label>
                    <select
                        value={namespace}
                        onChange={(e) => onChange?.({ ...data, canonicalNamespace: e.target.value || null })}
                        className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white focus:border-blue-500 outline-none"
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