"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
	fr: "FR",
	en: "EN",
	es: "ES",
};

export default function LocaleSwitcher() {
	const locale = useLocale();
	const router = useRouter();

	function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
		document.cookie = `NEXT_LOCALE=${event.target.value};path=/;max-age=31536000`;
		router.refresh();
	}

	return (
		<select
			defaultValue={locale}
			onChange={handleChange}
			className="border border-black rounded px-2 py-1 text-sm bg-white cursor-pointer"
			aria-label="Language switcher"
		>
			{routing.locales.map((loc) => (
				<option key={loc} value={loc}>
					{LOCALE_LABELS[loc] ?? loc}
				</option>
			))}
		</select>
	);
}