import { useTranslations } from "next-intl";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start">
          <div className="flex flex-col items-start gap-2 text-left w-full">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("tagline")}
            </p>
            <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              {t("title")}
            </h1>
          </div>
          <div className="w-full mt-8">
            <SearchBar />
          </div>
        </main>
      </div>
  );
}
