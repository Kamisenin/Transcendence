import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
    const t = await getTranslations("Privacy");

    return (
        <main className="max-w-3xl mx-auto px-6 pt-20 pb-12">
            <h1 className="text-3xl font-bold mb-6">
                {t("title")}
            </h1>

            <p className="mb-6">
                {t("intro")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("informationTitle")}
            </h2>
            <p className="mb-6">
                {t("informationText")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("usageTitle")}
            </h2>
            <p className="mb-6">
                {t("usageText")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("rightsTitle")}
            </h2>
            <p className="mb-6">
                {t("rightsText")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("contactTitle")}
            </h2>
            <p>
                {t("contactText")}
            </p>
        </main>
    );
}