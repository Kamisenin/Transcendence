-- AlterEnum
ALTER TYPE "FriendshipStatus" ADD VALUE 'BLOCKED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TAG_PAGE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'ORG_TAG_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'ORG_PAGE_REQUEST';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "org_page_request_id" INTEGER,
ADD COLUMN     "org_tag_request_id" INTEGER,
ADD COLUMN     "tag_page_request_id" INTEGER;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tag_page_request_id_fkey" FOREIGN KEY ("tag_page_request_id") REFERENCES "tag_page_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_tag_request_id_fkey" FOREIGN KEY ("org_tag_request_id") REFERENCES "org_tag_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_page_request_id_fkey" FOREIGN KEY ("org_page_request_id") REFERENCES "org_page_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
