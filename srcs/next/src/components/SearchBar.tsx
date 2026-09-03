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
}

export default function SearchBar() 
{
	const t = useTranslations("Common");
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Page[]>([]);

	useEffect(() => 
	{
		if (query.length < 3)
		{
			setResults([]);
			return;
		}
		const timer = setTimeout(() => 
		{
			fetch(`/api/search?query=${encodeURIComponent(query)}`)
			 .then((res) => res.json())
			 .then((data) => { setResults(Array.isArray(data) ? data : []); });
		}, 300);
		return () => clearTimeout(timer);
	}, [query]);

	return (
		<div className="relative">
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={t("search")}
				className="w-full px-4 py-3 border border-border rounded-full bg-background"
			/>
			<ul className="absolute top-full w-full mt-2 bg-popover border border-border rounded-lg z-10">
				{results.map((item) => (
					<li key={item.id}>
						<Link
							href={`/wiki/${item.namespace}/${item.slug}`}
							className="block px-4 py-2 hover:bg-accent cursor-pointer"
						>
							{item.title}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
