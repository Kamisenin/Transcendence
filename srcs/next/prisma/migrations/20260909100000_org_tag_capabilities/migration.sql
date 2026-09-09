ALTER TABLE "org_tag_requests" ADD COLUMN "tag_role_id" INTEGER;
ALTER TABLE "org_tag_capability" ADD COLUMN "tag_role_id" INTEGER;
ALTER TABLE "org_tag_capability" ADD COLUMN "can_edit_info" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "org_tag_capability" ADD COLUMN "can_delete_tag" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "org_tag_requests" ALTER COLUMN "permissions" DROP NOT NULL;

ALTER TABLE "org_tag_requests" ADD CONSTRAINT "org_tag_requests_tag_role_id_fkey"
  FOREIGN KEY ("tag_role_id") REFERENCES "tag_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "org_tag_capability" ADD CONSTRAINT "org_tag_capability_tag_role_id_fkey"
  FOREIGN KEY ("tag_role_id") REFERENCES "tag_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;