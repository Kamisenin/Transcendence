"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getOwnedPages, deletePage } from '@/actions/pages';

type Page = {
    pageId: number;
    title: string;
    createAt: string;
    lastModified: string;
    ownerAccount?: string;
}

export default function MyPages() {
    const t = useTranslations("MyPages");
    const tCommon = useTranslations('Common');
    const tTags = useTranslations('Tags');
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await getOwnedPages();
                if (mounted) setPages(res as any[] || []);
            } catch (e) {
                // ignore
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false };
    }, []);

    async function handleDelete(pageId: number) {
        if (!confirm(tTags('confirmDeletion') || 'Confirm deletion')) return;
        try {
            const res = await deletePage(pageId);
            if ((res as any)?.success) {
                setPages(prev => prev.filter(p => p.pageId !== pageId));
            } else {
                alert((res as any)?.error || tCommon('somethingWentWrong'));
            }
        } catch (e: any) {
            alert(e.message || tCommon('somethingWentWrong'));
        }
    }

    if (loading) {
        return (
            <main className="pt-20 flex justify-center">
                <div className="w-96 bg-white p-6 rounded shadow flex flex-col gap-6">{tCommon('loading')}</div>
            </main>
        );
    }

    if (pages.length === 0) {
        return (
            <main className="pt-20 flex justify-center">
                <div className="w-96 bg-white p-6 rounded shadow flex flex-col gap-6">{t('noPagesFound') || t('noPagesYet')}</div>
            </main>
        );
    }

    return (
        <main className="pt-20 flex justify-center">
            <div className="w-96 bg-white p-6 rounded shadow flex flex-col gap-4">
                {pages.map(item => (
                    <div key={item.pageId} className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold">{item.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-400">{t('owner', { owner: item.ownerAccount })}</div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/wiki/${item.ownerAccount}/${item.pageId}`} className="text-sm text-blue-600">{t('preview')}</Link>
                            <Link href={`/wiki/${item.ownerAccount}/${item.pageId}/edit`} className="text-sm text-blue-600">{t('edit')}</Link>
                            <button onClick={() => handleDelete(item.pageId)} className="text-sm text-red-600">{tCommon('delete')}</button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
