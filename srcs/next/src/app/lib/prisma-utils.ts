import { prisma } from "%/lib/prisma";

export async function getUser(formData: FormData)
{
    const email = formData.get("email") as string;
    const accountId = formData.get("account_id") as string;

    if (!password) {
        throw new Error("Field required");
    }
    if (!email) {
        if (!accountId)
            throw new Error("Field required");
        return await prisma.users.findUnique({ where : { accountId:accountId } });
    } else if (!accountId) {
        return (await prisma.user.findUnique({ where: { email:email } }));
    } else
        throw new Error("Field required");
}

export async function isEmailUsed(email: string) : boolean
{
    if (!email)
        throw new Error("Field required");

    return await prisma.user.findUnique({ where: { email: email } }) != null;
}

export async function isAccountIdUsed(accountId: string) : boolean
{
    if (!accountId)
        throw new Error("Field required");

    return await prisma.user.findUnique({ where: { accountId:accountId } }) != null;
}

export async function createUser(password : string, email: string, accountId: string, username: string)
{
    return await prisma.user.create({ data: { password: password, email: email, accountId:accountId, username:username } });
}