import { getCurrentUser } from "%/lib/session";
import { redirect } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import { getTranslations } from "next-intl/server";
import TwoFactorToggle from "@/components/TwoFactor"
import DeleteAccountButton from "@/components/DeleteAccountButton";
import SessionList from "@/components/SessionsList";
import UploadProfilePicture from "@/components/UploadProfilePicture";

export default async function AccountPage() {
    const user = await getCurrentUser();
    const t = await getTranslations("Account");

    if (!user) {
        redirect("/login");
    }
    return (
        <main className="pt-20 flex justify-center">
            <div className="w-96 bg-white p-6 rounded shadow">
				<div className="flex items-center gap-4 pb-5 mb-6 border-b border-gray-200">
					<UploadProfilePicture initialImgLink={user.imgLink} />
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							{t("title")}
						</h1>
						<p className="text-sm text-gray-500">
							Manage your account
						</p>
					</div>
				</div>
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