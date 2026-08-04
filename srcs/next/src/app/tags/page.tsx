import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/actions/tags';
import { getUserTags } from '%/lib/tag_permissions';

export default async function MyTagsPage() {
    const user = await requireUser();

    const tags = await getUserTags(user.user_id);

    return (
        <div className="max-w-4xl mx-auto p-8 pt-20">
            <h1 className="text-2xl font-bold mb-6">My Tags</h1>

            {tags.length === 0 ? (
                <p className="text-gray-500">Tu n'as accès à aucun tag pour le moment.</p>
            ) : (
                <div className="grid gap-3">
                    {tags.map(tag => (
                        <Link
                            key={tag.name}
                            href={`/tags/${tag.name}`}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color ? `#${tag.color.toString(16).padStart(6, '0')}` : '#ccc' }}
                                />
                                <span className="font-medium">{tag.name}</span>
                            </div>
                            {tag.ownerToken === user.user_id && (
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Owner</span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}