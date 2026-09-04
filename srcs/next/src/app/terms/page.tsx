import { getTranslations } from "next-intl/server";


export default async function TermsPage() {
    const t = await getTranslations("Terms");

    return (
        <main className="max-w-3xl mx-auto px-6 pt-20 pb-12">
            <h1 className="text-3xl font-bold mb-6">
                {t("title")}
            </h1>

            <p className="mb-6">
                {t("intro")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("respectTitle")}
            </h2>
            <p className="mb-6">
                {t("respectText")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("accountTitle")}
            </h2>
            <p className="mb-6">
                {t("accountText")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("contentTitle")}
            </h2>
            <p className="mb-6">
                {t("contentText")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("terminationTitle")}
            </h2>
            <p className="mb-6">
                {t("terminationText")}
            </p>

            <h2 className="text-xl font-semibold mb-2">
                {t("changesTitle")}
            </h2>
            <p>
                {t("changesText")}
            </p>
        </main>
    );
}