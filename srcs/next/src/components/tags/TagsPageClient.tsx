"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import CreateTagModal from "@/components/tags/CreateTagModal";
import { useTranslations } from "next-intl";

export default function TagsPageClient() {
    const t = useTranslations("Tags");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#800000] px-3 py-[7px] text-sm font-semibold text-[#fffaf7] shadow-sm transition hover:bg-[#5f0000] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a64b42] focus-visible:ring-offset-2"
            >
                <Plus size={14} />
                {t('newTag')}
            </button>

            <CreateTagModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onTagCreated={() => router.refresh()}
            />
        </>
    );
}