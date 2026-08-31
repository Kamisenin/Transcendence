import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/session";
import { prisma } from "%/lib/prisma/prisma";

export async function GET() {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({error: "Not logged in"}, {status: 401});

    const [ownedPages, ownedTags, ownedOrganiazations, tagMemberships, orgMemberships] = await Promise.all([
        prisma.page.findMany({where: {ownerId: user.user_id}}),
        prisma.tag.findMany({where: {ownerToken: user.user_id}}),
        prisma.organization.findMany({where: {ownerToken: user.user_id}}),
        prisma.tagMember.findMany({where: {userToken: user.user_id}, include: {tag: true, role: true}}),
        prisma.organizationMember.findMany({where: {userToken: user.user_id}, include: {organization: true, role: true}}),
    ]);
    const exportData = {
        profile: {
            username: user.username,
            email: user.email,
            accountId: user.accountId,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
        },
        ownedPages,
        ownedTags,
        ownedOrganiazations,
        tagMemberships,
        orgMemberships,
    };
    return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="my-data.json"`},
    });
}
