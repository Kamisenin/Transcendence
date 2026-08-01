import { getCurrentUser } from "%/lib/session";
import { redirect } from "next/navigation";
import AccountForm from "@/components/AccountForm";

export default async function AccountPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }
    return (
        <main className="pt-20 flex justify-center">
            <div className="w-96 bg-white p-6 rounded shadow">
                <h1 className="text-2xl font-bold mb-4">
                    My Account
                </h1>
                <AccountForm user={user}/>
            </div>
        </main>
    );
}