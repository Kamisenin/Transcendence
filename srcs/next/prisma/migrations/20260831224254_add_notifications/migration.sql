-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAGE_EDITED');

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "last_edited_by_id" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "page_id" INTEGER,
    "type" "NotificationType" NOT NULL DEFAULT 'PAGE_EDITED',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipient_id_read_idx" ON "notifications"("recipient_id", "read");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_last_edited_by_id_fkey" FOREIGN KEY ("last_edited_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;
