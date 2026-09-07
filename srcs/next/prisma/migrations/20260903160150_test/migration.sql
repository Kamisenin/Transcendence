/*
  Warnings:

  - A unique constraint covering the columns `[namespace]` on the table `tags` will be added. If there are existing duplicate values, this will fail.
  - Made the column `account_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PageReactionType" AS ENUM ('FAVORITE', 'DISLIKE');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "account_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "user_tag_interests" (
    "user_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "user_tag_interests_pkey" PRIMARY KEY ("user_id","tag_id")
);

-- CreateTable
CREATE TABLE "tag_statistics" (
    "tag_id" INTEGER NOT NULL,
    "document_frequency" INTEGER NOT NULL DEFAULT 0,
    "idf" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "tag_statistics_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "page_reactions" (
    "user_id" TEXT NOT NULL,
    "page_id" INTEGER NOT NULL,
    "type" "PageReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_reactions_pkey" PRIMARY KEY ("user_id","page_id")
);

-- CreateIndex
CREATE INDEX "user_tag_interests_user_id_idx" ON "user_tag_interests"("user_id");

-- CreateIndex
CREATE INDEX "page_reactions_user_id_type_idx" ON "page_reactions"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "tags_namespace_key" ON "tags"("namespace");

-- AddForeignKey
ALTER TABLE "user_tag_interests" ADD CONSTRAINT "user_tag_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tag_interests" ADD CONSTRAINT "user_tag_interests_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_statistics" ADD CONSTRAINT "tag_statistics_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_reactions" ADD CONSTRAINT "page_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_reactions" ADD CONSTRAINT "page_reactions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;
