import { redirect } from "next/navigation";
import { getSessionUser } from "%/lib/session";
import { cookies } from "next/headers";

export default async function RedirectLayout({children}: Readonly<{ children: React.ReactNode; }>)
{
    const cookieStore = await cookies();
    const token = cookieStore.get("session_id")?.value;
    const user = token ? await getSessionUser(token) : null;
    if (user)
        redirect("/");
    return <div>{children}</div>
}