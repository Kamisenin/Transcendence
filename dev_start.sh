#!/bin/bash

PSSWD=$(cat secrets/db_website_pwd.txt)

export DATABASE_URL="postgres://website_db_admin:${PSSWD}@127.0.0.1:5432/WEBSITE?schema=public"
export SEARCH_ENGINE_URL="http://localhost:8000"
export GMAIL_USER=$(cat secrets/gmail_user.txt)
export GMAIL_APP_PASSWORD=$(cat secrets/gmail_app_pwd.txt)

npm run dev --prefix srcs/next/
