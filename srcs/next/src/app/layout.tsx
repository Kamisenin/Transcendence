import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "%/lib/session";
import UserMenu from "@/components/UserMenu";
import HomeButton from "@/components/HomeButton";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link"
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "42 chan",
  description: "A wiki for wikis",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    const user = await getCurrentUser();
    const locale = await getLocale();
    const messages = await getMessages();
    const t = await getTranslations("Footer");
    return (
        <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
        <header className="fixed top-0 z-50 h-16 w-full bg-beige flex items-center justify-between px-6">
            <HomeButton />
            <div className="flex items-center gap-4">
                <LocaleSwitcher />
                {user && <NotificationBell />}
                <UserMenu user={user} />
            </div>
        </header>
        <main className="min-h-full item-center flex flex-col">{children}</main>
        <footer className={"flex z-50 h-16 w-full bg-beige items-center justify-center"}>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="hover:underline">
              <p>{t("privacyPolicy")}</p>
            </Link>
            <p>{t("and")}</p>
            <Link href="/terms" className="hover:underline">
              <p>{t("termsOfService")}</p>
            </Link>
          </div>
        </footer>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}