import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { getCurrentUser } from "%/lib/session";
import UserMenu from "@/components/UserMenu";
import HomeButton from "@/components/HomeButton";
import LocaleSwitcher from "@/components/LocaleSwitcher";

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

    return (
        <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body>
        <NextIntlClientProvider>
        <header className="fixed top-0 z-50 h-16 w-full bg-beige flex items-center justify-between px-6">
            <HomeButton />
            <div className="flex items-center gap-4">
                <LocaleSwitcher />
                <UserMenu user={user} />
            </div>
        </header>
        <main className="min-h-full item-center flex flex-col">{children}</main>
        <footer className={"flex z-50 h-16 w-full bg-beige items-center justify-center"}>
            <p>Privacy Policy and Terms of Service</p>
        </footer>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}