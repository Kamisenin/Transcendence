import { prisma } from "%/lib/prisma";

export async function getUser(id : string)
{
    let user = await prisma.user.findUnique({ where : { accountId:id } });
    if (!user)
        user = await prisma.user.findUnique({ where : { email:id } });
    return user;
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