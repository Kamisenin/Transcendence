import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "%/lib/session";
import LogoutButton from "@/components/LogoutButton";

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
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body>
        <header className="fixed top-0 h-16 w-full bg-beige flex items-center justify-center gap-24 px-6 z-10">
            <div>hello</div>

            {user ? (
                <div className="flex items-center gap-3">
                    <span>{user.username}</span>
                    <LogoutButton />
                </div>
            ) : (
                <a href="/login" className="text-sm underline">
                    log in
                </a>
            )}
        </header>
        <main className="flex-col justify-center">{children}</main>
        <footer className={"flex h-16 w-full bg-beige items-center justify-center"}>
            <p>Privacy Policy and Terms of Service</p>
        </footer>
        </body>
        </html>
    );
}
