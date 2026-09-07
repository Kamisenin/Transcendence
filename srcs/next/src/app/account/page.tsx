import { getCurrentUser } from "%/lib/session";
import { redirect } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import { getTranslations } from "next-intl/server";
import TwoFactorToggle from "@/components/TwoFactor"
import DeleteAccountButton from "@/components/DeleteAccountButton";
import SessionList from "@/components/SessionsList";

export default async function AccountPage() {
    const user = await getCurrentUser();
    const t = await getTranslations("Account");

    if (!user) {
        redirect("/login");
    }
    return (
        <main className="pt-20 flex justify-center">
            <div className="w-96 bg-white p-6 rounded shadow">
                <h1 className="text-2xl font-bold mb-4">
                    {t("title")}
                </h1>
                <AccountForm user={user}/>
                <TwoFactorToggle twoFactorEnabled={user.twoFactorEnabled} emailVerified={user.emailVerified}/>
                <div className="pt-8">
                    <SessionList/>
                </div>
                <div className="border-t pt-4">
                    <DeleteAccountButton/>
                </div>
            </div>
        </main>
    );
}