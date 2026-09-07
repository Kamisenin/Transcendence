"use client";

import { useTransition, useState } from 'react';
import { reviewTagPageRequest } from '@/actions/tags';

type PendingRequest = {
    id: number;
    pageId: number;
    createdAt: Date;
    page: { pageId: number; title: string };
    requester: { user_id: string; username: string };
};

type Props = {
    tagId: number;
    requests: PendingRequest[];
};

export default function TagRequestsPanel({ requests }: Props) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [handledIds, setHandledIds] = useState<number[]>([]);

    function handleReview(requestId: number, accept: boolean) {
        setError(null);
        startTransition(async () => {
            try {
                await reviewTagPageRequest(requestId, accept);
                setHandledIds(prev => [...prev, requestId]);
            } catch (e: any) {
                setError(e.message);
            }
        });
    }

    const visible = requests.filter(r => !handledIds.includes(r.id));

    return (
        <div>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                    {error}
                </div>
            )}

            {visible.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune demande en attente.</p>
            ) : (
                <div className="divide-y border rounded-lg overflow-hidden">
                    {visible.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3">
                            <div>
                                <p className="text-sm">
                                    <span className="font-medium">{req.requester.username}</span>
                                    {' '}demande à ajouter la page{' '}
                                    <span className="font-medium">{req.page.title || 'Sans titre'}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReview(req.id, true)}
                                    disabled={isPending}
                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                >
                                    Accepter
                                </button>
                                <button
                                    onClick={() => handleReview(req.id, false)}
                                    disabled={isPending}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                                >
                                    Refuser
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}