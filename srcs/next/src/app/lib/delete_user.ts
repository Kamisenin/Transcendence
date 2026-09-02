import { prisma } from "%/lib/prisma/prisma"

export const DELETED_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DELETED_USER_EMAIL = "delete_user@noreply.local";

export async function DeletedUserExists(){
    const existing = await prisma.user.findUnique({
            where: {user_id: DELETED_USER_ID}
    });
    if (existing)
        return existing;
    
    return await prisma.user.create({
        data: {
            user_id: DELETED_USER_ID,
            username: "Deleted user",
            accountId: "DELETED_USER",
            email: DELETED_USER_EMAIL,
            password: "!",
            emailVerified: true,
        },
    });
}