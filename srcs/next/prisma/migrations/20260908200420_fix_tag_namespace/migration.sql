/*
  Warnings:

  - Made the column `namespace` on table `tags` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "namespace" SET NOT NULL;
