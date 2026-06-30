"use server";

import bcrypt from 'bcrypt';
import { redirect } from "next/navigation";
import { getUser, isEmailUsed, isAccountIdUsed, createUser } from "%/lib/prisma-utils";

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
    createUser(password, email, accountId, username);
    redirect("/auth/login");
}


export async function loginUser(formData: FormData) : boolean {
    const password = formData.get("password") as string;

    const user = await getUser(formData);
    if (!user)
        return false;
    const passwordMatch = await bcrypt.compare(password, user.password) as boolean;
    return passwordMatch;
}

