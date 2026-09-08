import { useTranslations } from "next-intl";
import SearchBar from "@/components/SearchBar";
import RecentlyEdited from "@/components/RecentlyEdited";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-start bg-[#f0e0d6] font-sans">
      <main className="flex w-full flex-1 flex-col items-center justify-center bg-[#f0e0d6] px-6 sm:items-start sm:px-16">
          <div className="flex flex-col items-start gap-2 text-left w-full">
            <p className="text-sm text-[#8a6b63]">
              {t("tagline")}
            </p>
            <h1 className="text-3xl font-semibold leading-10 tracking-tight text-[#800000]">
              {t("title")}
            </h1>
          </div>
          <div className="w-full mt-8">
            <SearchBar />
          </div>
          <RecentlyEdited />
        </main>
      </div>
  );
}