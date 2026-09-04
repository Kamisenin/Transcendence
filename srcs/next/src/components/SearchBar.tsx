"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface Page 
{
	id: number;
	title: string;
	tags: string[];
	score: number;
	namespace: string;
	slug: string;
	owner: string;
}

export default function SearchBar() 
{
	const t = useTranslations("Common");
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Page[]>([]);
	const [searched, setSearched] = useState(false);

	useEffect(() => 
	{
		if (query.length < 3)
		{
			setResults([]);
			setSearched(false);
			return;
		}
		const timer = setTimeout(() => 
		{
			fetch(`/api/search?query=${encodeURIComponent(query)}`)
			 .then((res) => res.json())
			 .then((data) => {
				setResults(Array.isArray(data) ? data : []);
				setSearched(true);
			 });
		}, 300);
		return () => clearTimeout(timer);
	}, [query]);

	const showDropdown = query.length >= 3 && (searched || results.length > 0);

	return (
		<div className="relative">
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={t("search")}
				className="w-full px-4 py-3 border border-border rounded-full bg-background"
			/>
			{showDropdown && (
				<ul className="absolute top-full w-full mt-2 bg-popover border border-border rounded-lg z-10 overflow-hidden">
					{results.length === 0 ? (
						<li className="px-4 py-3 text-sm text-muted-foreground">
							Aucun résultat trouvé
						</li>
					) : (
						results.map((item) => (
							<li key={item.id}>
								<Link
									href={`/wiki/${item.namespace}/${item.slug}`}
									className="block px-4 py-2 hover:bg-accent cursor-pointer"
								>
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium truncate">{item.title}</span>
										{item.owner && (
											<span className="text-xs text-muted-foreground shrink-0">
												par {item.owner}
											</span>
										)}
									</div>
									{item.tags?.length > 0 && (
										<div className="flex flex-wrap gap-1 mt-1">
											{item.tags.slice(0, 5).map((tag) => (
												<span
													key={tag}
													className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground"
												>
													{tag}
												</span>
											))}
										</div>
									)}
								</Link>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	);
}