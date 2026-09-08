/*
  Warnings:

  - The values [BLOCKED] on the enum `FriendshipStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `path` on the `Upload` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `Upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Upload` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FriendshipStatus_new" AS ENUM ('PENDING', 'ACCEPTED');
ALTER TABLE "public"."Friendship" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Friendship" ALTER COLUMN "status" TYPE "FriendshipStatus_new" USING ("status"::text::"FriendshipStatus_new");
ALTER TYPE "FriendshipStatus" RENAME TO "FriendshipStatus_old";
ALTER TYPE "FriendshipStatus_new" RENAME TO "FriendshipStatus";
DROP TYPE "public"."FriendshipStatus_old";
ALTER TABLE "Friendship" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FRIEND_REQUEST';

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "path",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "friendship_id" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "img_link" SET DEFAULT '/defaultUserProfilePicture.svg';

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_friendship_id_fkey" FOREIGN KEY ("friendship_id") REFERENCES "Friendship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
