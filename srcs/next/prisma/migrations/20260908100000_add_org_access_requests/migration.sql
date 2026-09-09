CREATE TABLE "org_tag_requests" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "min_role_id" INTEGER NOT NULL,
    "permissions" "PermissionLevel" NOT NULL,
    "requested_by" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "org_tag_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "org_page_requests" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,
    "min_role_id" INTEGER NOT NULL,
    "permissions" "PermissionLevel" NOT NULL,
    "requested_by" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "org_page_requests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "org_tag_requests" ADD CONSTRAINT "org_tag_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_tag_requests" ADD CONSTRAINT "org_tag_requests_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_tag_requests" ADD CONSTRAINT "org_tag_requests_min_role_id_fkey" FOREIGN KEY ("min_role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_tag_requests" ADD CONSTRAINT "org_tag_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_tag_requests" ADD CONSTRAINT "org_tag_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "org_page_requests" ADD CONSTRAINT "org_page_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_page_requests" ADD CONSTRAINT "org_page_requests_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_page_requests" ADD CONSTRAINT "org_page_requests_min_role_id_fkey" FOREIGN KEY ("min_role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_page_requests" ADD CONSTRAINT "org_page_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_page_requests" ADD CONSTRAINT "org_page_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "org_tag_requests_org_id_status_idx" ON "org_tag_requests"("org_id", "status");
CREATE INDEX "org_page_requests_org_id_status_idx" ON "org_page_requests"("org_id", "status");