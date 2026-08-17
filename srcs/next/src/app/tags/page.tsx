import Link from 'next/link';
import { requireUser, createTag } from '@/actions/tags';
import { getUserTags } from '%/lib/tag_permissions';

export default async function MyTagsPage() {
    const user = await requireUser();
    const tags = await getUserTags(user.user_id);

    return (
        <div className="max-w-4xl mx-auto p-8 pt-20">
            <h1 className="text-2xl font-bold mb-6">My Tags</h1>

            {/* Create tag */}
            <form action={createTag} className="mb-8 p-4 border rounded-lg bg-white space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">Créer un tag</h2>

                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom *</label>
                        <input
                            name="name"
                            required
                            placeholder="ex: react"
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Couleur</label>
                        <input
                            type="color"
                            name="color"
                            defaultValue="#3b82f6"
                            className="w-16 h-8 border rounded"
                        />
                    </div>
                    <input
                        name="namespace"
                        placeholder="namespace (optional)"
                        className="w-full border rounded px-3 py-1.5 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        name="description"
                        rows={2}
                        placeholder="Description optionnelle"
                        className="w-full border rounded px-3 py-1.5 text-sm"
                    />
                </div>

                <button
                    type="submit"
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg"
                >
                    Create Tag
                </button>
            </form>

            {tags.length === 0 ? (
                <p className="text-gray-500">You don't have access to any tag at the moment.</p>
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