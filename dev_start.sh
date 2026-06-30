#!/bin/bash

PSSWD=$(cat secrets/db_website_pwd.txt)

export DATABASE_URL="postgres://website_db_admin:${PSSWD}@127.0.0.1:5432/WEBSITE?schema=public"

npm run dev --prefix srcs/next/
