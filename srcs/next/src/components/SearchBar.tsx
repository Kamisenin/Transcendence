		"use client";
		import { useState, useEffect } from "react";

		export default function SearchBar() 
		{
			const [query, setQuery] = useState("");
			const [results, setResults] = useState([]);

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
						placeholder="Rechercher..."
					/>
					<ul>
						{results.map((item) => (
							<li key={item.id}>{item.title}</li>
						))}
					</ul>
				</div>
			);
		}