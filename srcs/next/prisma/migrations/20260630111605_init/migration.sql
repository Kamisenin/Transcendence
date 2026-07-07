-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "username" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "img_link" TEXT NOT NULL DEFAULT '',
    "mail" TEXT NOT NULL,
    "passwd" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "owner_token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_roles" (
    "id" SERIAL NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "role_name" TEXT NOT NULL,
    "hierarchy_level" INTEGER NOT NULL,
    "can_manage_members" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_roles" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_info" BOOLEAN NOT NULL DEFAULT false,
    "can_delete_tag" BOOLEAN NOT NULL DEFAULT false,
    "can_add_page" BOOLEAN NOT NULL DEFAULT false,
    "can_revoke_page" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_page_grants" BOOLEAN NOT NULL DEFAULT false,
    "can_review_requests" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tag_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_members" (
    "tag_id" INTEGER NOT NULL,
    "user_token" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "tag_members_pkey" PRIMARY KEY ("tag_id","user_token")
);

-- CreateTable
CREATE TABLE "tag_permissions" (
    "tag_id" INTEGER NOT NULL,
    "user_token" TEXT NOT NULL,
    "can_manage_members" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_roles" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_info" BOOLEAN NOT NULL DEFAULT false,
    "can_delete_tag" BOOLEAN NOT NULL DEFAULT false,
    "can_add_page" BOOLEAN NOT NULL DEFAULT false,
    "can_revoke_page" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_page_grants" BOOLEAN NOT NULL DEFAULT false,
    "can_review_requests" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tag_permissions_pkey" PRIMARY KEY ("tag_id","user_token")
);

-- CreateTable
CREATE TABLE "pages" (
    "page_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("page_id")
);

-- CreateTable
CREATE TABLE "page_permissions" (
    "page_id" INTEGER NOT NULL,
    "user_token" TEXT NOT NULL,
    "permissions" "PermissionLevel" NOT NULL,
    "can_manage_permissions" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_tags" BOOLEAN NOT NULL DEFAULT false,
    "can_request_tags" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "page_permissions_pkey" PRIMARY KEY ("page_id","user_token")
);

-- CreateTable
CREATE TABLE "tag_pages" (
    "tag_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,

    CONSTRAINT "tag_pages_pkey" PRIMARY KEY ("tag_id","page_id")
);

-- CreateTable
CREATE TABLE "tag_page_requests" (
    "id" SERIAL NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,
    "requested_by" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_page_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_page_access" (
    "page_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "min_role_id" INTEGER NOT NULL,
    "permissions" "PermissionLevel" NOT NULL,

    CONSTRAINT "tag_page_access_pkey" PRIMARY KEY ("page_id","tag_id")
);

-- CreateTable
CREATE TABLE "org_page_access" (
    "org_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,
    "min_role_id" INTEGER NOT NULL,
    "permissions" "PermissionLevel" NOT NULL,

    CONSTRAINT "org_page_access_pkey" PRIMARY KEY ("org_id","page_id")
);

-- CreateTable
CREATE TABLE "tag_page_capability" (
    "page_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "can_manage_permissions" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_tags" BOOLEAN NOT NULL DEFAULT false,
    "can_request_tags" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tag_page_capability_pkey" PRIMARY KEY ("page_id","tag_id","role_id")
);

-- CreateTable
CREATE TABLE "org_page_capability" (
    "org_id" INTEGER NOT NULL,
    "page_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "can_manage_permissions" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_tags" BOOLEAN NOT NULL DEFAULT false,
    "can_request_tags" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "org_page_capability_pkey" PRIMARY KEY ("org_id","page_id","role_id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "owner_token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_roles" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "role_name" TEXT NOT NULL,
    "hierarchy_level" INTEGER NOT NULL,
    "can_manage_members" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_roles" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_info" BOOLEAN NOT NULL DEFAULT false,
    "can_delete_org" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_org_page_grants" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_org_tag_grants" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organization_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "organization_id" INTEGER NOT NULL,
    "user_token" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("organization_id","user_token")
);

-- CreateTable
CREATE TABLE "org_tag_access" (
    "org_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "min_role_id" INTEGER NOT NULL,
    "permissions" "PermissionLevel" NOT NULL,

    CONSTRAINT "org_tag_access_pkey" PRIMARY KEY ("org_id","tag_id")
);

-- CreateTable
CREATE TABLE "org_tag_capability" (
    "org_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "can_manage_tag_members" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_tag_roles" BOOLEAN NOT NULL DEFAULT false,
    "can_add_page" BOOLEAN NOT NULL DEFAULT false,
    "can_revoke_page" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_page_grants" BOOLEAN NOT NULL DEFAULT false,
    "can_review_requests" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "org_tag_capability_pkey" PRIMARY KEY ("org_id","tag_id","role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_mail_key" ON "users"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_roles_tag_id_hierarchy_level_key" ON "tag_roles"("tag_id", "hierarchy_level");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organization_roles_organization_id_hierarchy_level_key" ON "organization_roles"("organization_id", "hierarchy_level");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_token_fkey" FOREIGN KEY ("user_token") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_owner_token_fkey" FOREIGN KEY ("owner_token") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_roles" ADD CONSTRAINT "tag_roles_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_members" ADD CONSTRAINT "tag_members_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_members" ADD CONSTRAINT "tag_members_user_token_fkey" FOREIGN KEY ("user_token") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_members" ADD CONSTRAINT "tag_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tag_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_permissions" ADD CONSTRAINT "tag_permissions_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_permissions" ADD CONSTRAINT "tag_permissions_user_token_fkey" FOREIGN KEY ("user_token") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_permissions" ADD CONSTRAINT "page_permissions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_permissions" ADD CONSTRAINT "page_permissions_user_token_fkey" FOREIGN KEY ("user_token") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_pages" ADD CONSTRAINT "tag_pages_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_pages" ADD CONSTRAINT "tag_pages_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_requests" ADD CONSTRAINT "tag_page_requests_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_requests" ADD CONSTRAINT "tag_page_requests_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_requests" ADD CONSTRAINT "tag_page_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_requests" ADD CONSTRAINT "tag_page_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_access" ADD CONSTRAINT "tag_page_access_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_access" ADD CONSTRAINT "tag_page_access_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_access" ADD CONSTRAINT "tag_page_access_min_role_id_fkey" FOREIGN KEY ("min_role_id") REFERENCES "tag_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_page_access" ADD CONSTRAINT "org_page_access_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_page_access" ADD CONSTRAINT "org_page_access_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_page_access" ADD CONSTRAINT "org_page_access_min_role_id_fkey" FOREIGN KEY ("min_role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_capability" ADD CONSTRAINT "tag_page_capability_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_capability" ADD CONSTRAINT "tag_page_capability_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_page_capability" ADD CONSTRAINT "tag_page_capability_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tag_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_page_capability" ADD CONSTRAINT "org_page_capability_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_page_capability" ADD CONSTRAINT "org_page_capability_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("page_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_page_capability" ADD CONSTRAINT "org_page_capability_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_token_fkey" FOREIGN KEY ("owner_token") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_roles" ADD CONSTRAINT "organization_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_token_fkey" FOREIGN KEY ("user_token") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tag_access" ADD CONSTRAINT "org_tag_access_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tag_access" ADD CONSTRAINT "org_tag_access_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tag_access" ADD CONSTRAINT "org_tag_access_min_role_id_fkey" FOREIGN KEY ("min_role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tag_capability" ADD CONSTRAINT "org_tag_capability_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tag_capability" ADD CONSTRAINT "org_tag_capability_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tag_capability" ADD CONSTRAINT "org_tag_capability_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
