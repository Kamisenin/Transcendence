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
				<main className="flex justify-center bg-[#f0e0d6] px-4 pb-12 pt-20">
						<div className="w-full max-w-md border border-[#d9bfb7] border-t-4 border-t-[#800000] bg-[#fffaf7] p-6 shadow-[0_2px_10px_rgba(128,0,0,0.08)]">
				<div className="mb-6 flex items-center gap-4 border-b border-[#ead7d0] pb-5">
					<UploadProfilePicture initialImgLink={user.imgLink} />
					<div>
						<h1 className="text-2xl font-bold text-[#800000]">
							{t("title")}
						</h1>
						<p className="text-sm text-[#8a6b63]">
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