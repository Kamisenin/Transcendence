"use client";

import { useLocale, useTranslations } from "next-intl";
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
	const t = useTranslations("LocaleSwitcher");

	function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
		document.cookie = `NEXT_LOCALE=${event.target.value};path=/;max-age=31536000`;
		router.refresh();
	}

	return (
		<select
			defaultValue={locale}
			onChange={handleChange}
			className="cursor-pointer border border-[#a98275] bg-[#fffaf7] px-2 py-1 text-sm text-[#3f2924]"
			aria-label={t("ariaLabel")}
		>
			{routing.locales.map((loc) => (
				<option key={loc} value={loc}>
					{LOCALE_LABELS[loc] ?? loc}
				</option>
			))}
		</select>
	);
}