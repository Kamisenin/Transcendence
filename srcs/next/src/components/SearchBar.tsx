"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Page 
{
	id: number;
	title: string;
	tags: string[];
	score: number;
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
				.then((data) => { setResults(data) });
		}, 300);
		return () => clearTimeout(timer);
	}, [query]);

	return (
		<div>
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={t("search")}
			/>
			<ul>
				{results.map((item) => (
					<li key={item.id}>{item.title}</li>
				))}
			</ul>
		</div>
	);
}