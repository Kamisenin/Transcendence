"use server";

import bcrypt from 'bcrypt';
import { redirect } from "next/navigation";
import { getUser, isEmailUsed, isAccountIdUsed, createUser } from "%/lib/prisma-utils";
import {prisma} from "%/lib/prisma";
import { cookies } from 'next/headers'
import { getUserIp } from "%/lib/auth";

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
    createUser(hashedPassword, email, accountId, username);
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
    console.log("UserPassword: " + user.password + " password " + password);
    if (!passwordMatch) {
        throw new Error("Identifiants incorrects");
    }
    await createSession(user.user_id, false); // TODO add a "remember me" checkbox on login page
    redirect("/");
}

export async function createSession(userId : string, stayConnected: boolean) : string
{
    const ip : string = await getUserIp();
    console.log("IP :" + ip);
    const expiresAt = stayConnected
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 jours
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const session = await prisma.session.create({
        data : {
            userToken : userId,
            expiresAt : expiresAt,
            ipAddress: ip
        }
    })
    setCookies(session, stayConnected);
    return (session.id);
}

export async function setCookies(session: prisma.session, stayConnected: boolean)
{
    const cookieStore = await cookies();
    if (stayConnected) {
        cookieStore.set('session_id', session.id, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        return;
    }
    cookieStore.set('session_id', session.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30
    });
}