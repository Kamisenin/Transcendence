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
                className="inline-flex items-center gap-1.5 rounded-md border border-black/0 bg-[#3b3b3b] px-3 py-[7px] text-sm font-medium text-white shadow-sm hover:bg-[#222222] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0969da] focus-visible:ring-offset-2"
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