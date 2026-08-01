-- CreateTable
CREATE TABLE "Upload" (
    "id" SERIAL NOT NULL,
    "owner_token" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_owner_token_fkey" FOREIGN KEY ("owner_token") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
