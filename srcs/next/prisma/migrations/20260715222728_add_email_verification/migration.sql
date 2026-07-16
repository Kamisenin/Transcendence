-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verif_code" TEXT,
ADD COLUMN     "verif_expiry" TIMESTAMP(3);
