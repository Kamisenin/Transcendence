/*
  Warnings:

  - You are about to drop the column `slug` on the `pages` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SlugType" AS ENUM ('USER', 'TAG');

-- DropIndex
DROP INDEX "pages_slug_key";

-- AlterTable
ALTER TABLE "pages" DROP COLUMN "slug";

-- CreateTable
CREATE TABLE "page_slugs" (
    "id" SERIAL NOT NULL,
    "page_id" INTEGER NOT NULL,
    "namespace" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SlugType" NOT NULL,
    "is_canonical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_slugs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_slugs_namespace_slug_key" ON "page_slugs"("namespace", "slug");

-- AddForeignKey
ALTER TABLE "page_slugs" ADD CONSTRAINT "page_slugs_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;
