"use server";

import bcrypt from 'bcrypt';
import { cookies } from "next/headers"
import { redirect } from "next/navigation";
import { getUser, isEmailUsed, isAccountIdUsed, createUser } from "%/lib/prisma-utils";
import { createSession, deleteSession } from "%/lib/session";

const ten_y_ms = 10 * 365 * 24 * 60 * 60 * 1000;

export async function registerUser(formData: FormData) {
    const password = formData.get("password") as string;
    const email = formData.get("email") as string;
    const accountId = formData.get("account_id") as string;

    if (!password || !email || !accountId) {
        throw new Error("Field required");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password ready to be registered : ", hashedPassword);

    let username = formData.get("username") as string;
    if (!username) {
        username = accountId;
    }
    console.log("Email : " + email + " accountId : " + accountId);
    if (await isEmailUsed(email) || await isAccountIdUsed(accountId)) {
        throw new Error("Email or Account id already in use");
    }
    await createUser(hashedPassword, email, accountId, username);
    redirect("/auth/login");
}


export async function loginUser(formData: FormData) {
    const password = formData.get("password") as string;

    if (!password) {
        throw new Error("Field required");
    }

    const user = await getUser(formData);
    if (!user) {
        throw new Error("Identifiants incorrects");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error("Identifiants incorrects");
    }

    const token = await createSession(user.user_id);
    const cookieStore = await cookies();
    cookieStore.set("session", token, {httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: ten_y_ms,});
    redirect("/");
}

export async function logoutUser() {
    const   cookieStore = await cookies();
    const   token = cookieStore.get("session")?.value;

    if (token)
        await deleteSession(token);
    cookieStore.delete("session");
    redirect("/auth/login");
}