"use server";

import bcrypt from 'bcrypt';
import { getUser } from "%/lib/prisma-utils";

export async function registerUser(formData: FormData) {
    const password = formData.get("password") as string;
    const email = formData.get("email") as string;
    const accountId = formData.get("account_id") as string;

    if (!password || !email || !accountId) {
        throw new Error("Field required");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let username = formData.get("username") as string;
    if (!username)
        username = accountId;
    await prisma.user.create({ data: { email:email, password: hashedPassword } });

    console.log("Password ready to be registered : ", hashedPassword);

    return { success: true };
}


export async function loginUser(formData: FormData) : boolean {
    const password = formData.get("password") as string;

    const user = await getUser(formData);
    if (!user)
        return false;
    const passwordMatch = await bcrypt.compare(password, user.password) as boolean;
    return passwordMatch;
}

