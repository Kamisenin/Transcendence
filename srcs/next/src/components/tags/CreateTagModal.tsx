"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { checkTagNamespaceAvailability, checkTagNameAvailability, createTagAction } from "@/actions/tags";
import { useTranslations } from "next-intl";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onTagCreated: (tag: { id: string; name: string; color: string; namespace?: string | null }) => void;
};

const PRESET_COLORS = [
    "#3b82f6", "#ec4899", "#ef4444", "#f59e0b",
    "#10b981", "#8b5cf6", "#6366f1", "#64748b"
];

export default function CreateTagModal({ isOpen, onClose, onTagCreated }: Props) {
    const [name, setName] = useState("");
    const [namespace, setNamespace] = useState("");
    const [colorHex, setColorHex] = useState("#3b82f6");

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // État de validation du namespace
    const [nsStatus, setNsStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message?: string;
    }>({ checking: false, available: null });

    // Vérification dynamique du namespace
    useEffect(() => {
        if (!namespace.trim()) {
            setNsStatus({ checking: false, available: null });
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError(tTags("tagNameRequired"));
            return;
        }

        if (nameStatus.available === false) {
            setError(t("namespaceUnavailable"));
            return;
        }

        if (namespace.trim() && nsStatus.available === false) {
            setError(t("")); //TODO invalid namespace
            return;
        }

        try {
            setIsSubmitting(true);
            const created = await createTagAction({
                name,
                namespace: namespace.trim() || undefined,
                colorHex,
            });

            onTagCreated(created);

            // Reset
            setName("");
            setNamespace("");
            setColorHex("#3b82f6");
            onClose();
        } catch (err: any) {
            setError(err.message || tCommon("somethingWentWrong"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit =
        !isSubmitting &&
        !nameStatus.checking &&
        !nsStatus.checking &&
        nameStatus.available !== false &&
        (namespace.trim() === "" || nsStatus.available !== false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900">{t("title")}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                    {error && (
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 font-medium">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Nom */}
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">{t("nameLabel")}</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("namePlaceholder")}
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition"
                        />
                        {name.trim() !== "" && (
                            <div className="mt-1 flex items-center gap-1.5">
                                {nameStatus.checking ? (
                                    <span className="text-gray-400 flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" /> Checking availability...
                                    </span>
                                ) : nameStatus.available === true ? (
                                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                        <CheckCircle2 size={12} /> Name available
                                    </span>
                                ) : nameStatus.available === false ? (
                                    <span className="text-rose-500 flex items-center gap-1 font-medium">
                                        <AlertCircle size={12} /> {nameStatus.message ?? "This name is already taken"}
                                    </span>
                                ) : null}
                            </div>
                        )} {/* TODO LANGUAGE*/}
                    </div>

                    {/* Namespace */}
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                            {t("namespaceLabel")} <span className="font-normal text-gray-400">{t("namespaceOptional")}</span>
                        </label>
                        <input
                            type="text"
                            value={namespace}
                            onChange={(e) => setNamespace(e.target.value)}
                            placeholder={t("namespacePlaceholder")}
                            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition"
                        />
                        {namespace.trim() !== "" && (
                            <div className="mt-1 flex items-center gap-1.5">
                                {nsStatus.checking ? (
                                    <span className="text-gray-400 flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" /> {tCommon("searching")}
                                    </span>
                                ) : nsStatus.available === true ? (
                                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                        <CheckCircle2 size={12} /> {nsStatus.message ?? t("namespaceAvailable")}
                                    </span>
                                ) : nsStatus.available === false ? (
                                    <span className="text-rose-500 flex items-center gap-1 font-medium">
                                        <AlertCircle size={12} /> {nsStatus.message ?? "Invalid namespace"} {/* TODO LANGUAGE*/}
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Couleur */}
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1.5">{t("colorLabel")}</label>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="color"
                                value={colorHex}
                                onChange={(e) => setColorHex(e.target.value)}
                                className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                            />
                            <span className="font-mono text-gray-500 uppercase">{colorHex}</span>
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

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            {tCommon("cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition flex items-center gap-1.5"
                        >
                            {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                            {tCommon("create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}