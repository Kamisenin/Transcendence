import { getCurrentUser } from "%/lib/session";
import { redirect } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import TwoFactorToggle from "@/components/TwoFactor";

export default async function AccountPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }
    return (
        <main className="pt-20 flex justify-center">
            <div className="w-96 bg-white p-6 rounded shadow flex flex-col gap-6">
                <div>
                    <TwoFactorToggle
                        twoFactorEnabled={user.twoFactorEnabled}
                        emailVerified={user.emailVerified}
                    />
                </div>
            </div>
        </main>
    );
}