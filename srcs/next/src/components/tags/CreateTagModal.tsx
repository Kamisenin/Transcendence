"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { checkTagNamespaceAvailability, checkTagNameAvailability, createTagAction } from "@/actions/tags";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onTagCreated: (tag: { id: string; name: string; color: string; namespace?: string | null }) => void;
};

const PRESET_COLORS = [
    "#3b82f6", "#ec4899", "#ef4444", "#f59e0b",
    "#10b981", "#8b5cf6", "#6366f1", "#64748b",
    "#dfdfdc", "#222222", "#141414", "#000000"
];

type FieldStatus = {
    checking: boolean;
    available: boolean | null;
    message?: string;
};

const IDLE_STATUS: FieldStatus = { checking: false, available: null };
const TAG_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

function getTagError(code: string, t: ReturnType<typeof useTranslations>) {
    switch (code) {
        case "TAG_NAME_REQUIRED": return t('createModal.required');
        case "TAG_NAME_INVALID": return t('createModal.nameInvalid');
        case "TAG_NAME_TAKEN": return t('createModal.nameUnavailable');
        case "TAG_NAMESPACE_REQUIRED": return t('createModal.namespaceRequired');
        case "TAG_NAMESPACE_TAKEN": return t('createModal.namespaceUnavailable');
        case "TAG_NAMESPACE_INVALID": return t('createModal.namespaceInvalid');
        default: return t('genericError');
    }
}

export default function CreateTagModal({ isOpen, onClose, onTagCreated }: Props) {
    const [name, setName] = useState("");
    const [namespace, setNamespace] = useState("");
    const [colorHex, setColorHex] = useState("#3b82f6");

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [nameStatus, setNameStatus] = useState<FieldStatus>(IDLE_STATUS);
    const [nsStatus, setNsStatus] = useState<FieldStatus>(IDLE_STATUS);
    const t = useTranslations("Tags");
    const tCommon = useTranslations("Common");

    useEffect(() => {
        if (!name.trim()) {
            setNameStatus(IDLE_STATUS);
            return;
        }

        if (name.trim().length > 50 || !TAG_NAME_PATTERN.test(name.trim())) {
            setError('TAG_NAME_INVALID');
            return;
        }
        setNameStatus({ checking: true, available: null });
        const timer = setTimeout(async () => {
            const res = await checkTagNameAvailability(name);
            setNameStatus({ checking: false, available: res.available, message: res.message });
        }, 400);
        return () => clearTimeout(timer);
    }, [name, namespace]);

    useEffect(() => {
        if (!namespace.trim()) {
            setNsStatus(IDLE_STATUS);
            return;
        }
        setNsStatus({ checking: true, available: null });
        const timer = setTimeout(async () => {
            const res = await checkTagNamespaceAvailability(namespace);
            setNsStatus({ checking: false, available: res.available, message: res.message });
        }, 400);
        return () => clearTimeout(timer);
    }, [namespace]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('TAG_NAME_REQUIRED');
            return;
        }

        if (nameStatus.available !== true) {
            setError('TAG_NAME_TAKEN');
            return;
        }

        if (nsStatus.available !== true) {
            setError('TAG_NAMESPACE_INVALID');
            return;
        }

        if (!namespace.trim()) {
            setError('TAG_NAMESPACE_REQUIRED');
            return;
        }

        try {
            setIsSubmitting(true);
            const created = await createTagAction({
                name,
                namespace: namespace.trim(),
                colorHex,
            });

            onTagCreated(created);

            setName("");
            setNamespace("");
            setColorHex("#3b82f6");
            setNameStatus(IDLE_STATUS);
            setNsStatus(IDLE_STATUS);
            onClose();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'TAG_CREATE_FAILED');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit =
        !isSubmitting &&
        !nameStatus.checking &&
        !nsStatus.checking &&
        nameStatus.available === true &&
        nsStatus.available === true;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#d9bfb7] bg-[#fffaf7] shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[#ead7d0] px-5 py-3.5">
                    <h3 className="text-sm font-bold text-[#800000]">{t('createModal.title')}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-[#a89088] transition hover:bg-[#f7e9e2] hover:text-[#800000]"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-[#e6b8b0] bg-[#fff1ef] p-2.5 font-medium text-[#a33a2b]">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{getTagError(error, t)}</span>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block font-semibold text-[#3f2924]">{t('createModal.nameLabel')}</label>
                        <input
                            type="text"
                            required
                            value={name}
                            maxLength={50}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('createModal.namePlaceholder')}
                            className="w-full rounded-lg border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-xs outline-none transition focus:border-[#800000]"
                        />
                        {name.trim() !== "" && (
                            <div className="mt-1 flex items-center gap-1.5">
                                {nameStatus.checking ? (
                                    <span className="flex items-center gap-1 text-[#a89088]">
                                        <Loader2 size={12} className="animate-spin" /> {t('createModal.checkingAvailability')}
                                    </span>
                                ) : nameStatus.available === true ? (
                                        <span className="flex items-center gap-1 font-medium text-[#4f8f52]">
                                        <CheckCircle2 size={12} /> {t('createModal.nameAvailable')}
                                    </span>
                                ) : nameStatus.available === false ? (
                                        <span className="flex items-center gap-1 font-medium text-[#a33a2b]">
                                        <AlertCircle size={12} /> {getTagError(nameStatus.message ?? 'TAG_NAME_TAKEN', t)}
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block font-semibold text-[#3f2924]">
                            {t('createModal.namespaceLabel')}
                        </label>
                        <input
                            type="text"
                            value={namespace}
                            onChange={(e) => setNamespace(e.target.value)}
                            placeholder={t('createModal.namespacePlaceholder')}
                            className="w-full rounded-lg border border-[#d9bfb7] bg-[#fffaf7] px-3 py-2 text-xs outline-none transition focus:border-[#800000]"
                        />
                        {namespace.trim() !== "" && (
                            <div className="mt-1 flex items-center gap-1.5">
                                {nsStatus.checking ? (
                                    <span className="flex items-center gap-1 text-[#a89088]">
                                        <Loader2 size={12} className="animate-spin" /> {t('createModal.checking')}
                                    </span>
                                ) : nsStatus.available === true ? (
                                    <span className="flex items-center gap-1 font-medium text-[#4f8f52]">
                                        <CheckCircle2 size={12} /> {nsStatus.message ?? t('createModal.validNamespace')}
                                    </span>
                                ) : nsStatus.available === false ? (
                                    <span className="flex items-center gap-1 font-medium text-[#a33a2b]">
                                        <AlertCircle size={12} /> {getTagError(nsStatus.message ?? 'TAG_NAMESPACE_INVALID', t)}
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block font-semibold text-[#3f2924]">{t('createModal.colorLabel')}</label>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="color"
                                value={colorHex}
                                onChange={(e) => setColorHex(e.target.value)}
                                className="h-7 w-7 cursor-pointer rounded-lg border border-[#d9bfb7] bg-[#fffaf7] p-0.5"
                            />
                            <span className="font-mono uppercase text-[#8a6b63]">{colorHex}</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColorHex(c)}
                                    style={{ backgroundColor: c }}
                                    className={`w-5 h-5 rounded-full transition-transform ${
                                        colorHex.toLowerCase() === c.toLowerCase()
                                            ? "scale-125 ring-2 ring-offset-1 ring-gray-400"
                                            : "hover:scale-110"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-[#ead7d0] pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg bg-[#f7e9e2] px-3 py-1.5 font-medium text-[#3f2924] transition hover:bg-[#ead7d0]"
                        >
                            {tCommon('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex items-center gap-1.5 rounded-lg bg-[#800000] px-4 py-1.5 font-semibold text-[#fffaf7] shadow-xs transition hover:bg-[#5f0000] disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                            {tCommon('create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}