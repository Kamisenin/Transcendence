# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    page_creation_tests.py                             :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/08/01 23:43:36 by humontas          #+#    #+#              #
#    Updated: 2026/08/14 18:01:52 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import os
import psycopg2
import requests


_TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_TESTS_DIR)
_PWD_FILE = os.path.join(_PROJECT_ROOT, "secrets", "db_website_pwd.txt")

with open(_PWD_FILE) as f:
	password = f.read().strip()

def run_seed():
	results = []

	def check(name, condition, detail=""):
		results.append({"name": name, 
				  "passed": condition, 
				  "detail": detail})

	conn = psycopg2.connect(host="127.0.0.1", 
						 database="WEBSITE", 
						 user="website_db_admin", 
						 password=password)
	cur = conn.cursor()

	requests.post(
		"http://localhost:3000/api/auth/register",
		json={"email": "testuser1@test.com", "password": "password123", "accountId": "testuser1"}
	)
	cur.execute("SELECT user_id FROM users WHERE account_id = %s", ("testuser1",))
	row2 = cur.fetchone()
	check("testuser1 exists", row2 is not None)
	if not row2:
		return results, None
	user1_id = row2[0]

	cur.execute("SELECT user_id FROM users WHERE account_id = %s", ("testuser0",))
	row = cur.fetchone()
	check("testuser0 exists", row is not None)
	if not row:
		return results, None
	user_id = row[0]

	cur.execute("DELETE FROM tags WHERE name LIKE 'SEEDTEST_%'")
	cur.execute("INSERT INTO tags (owner_token, name) VALUES (%s, %s) RETURNING id",
			  (user_id, "SEEDTEST_python"))
	tag_id = cur.fetchone()[0]
	check("Tag created", tag_id is not None)

	cur.execute("DELETE FROM pages WHERE title LIKE 'SEEDTEST_%'")
	cur.execute(
		"INSERT INTO pages (title, owner_id, last_modified) VALUES (%s, %s, NOW()) RETURNING page_id",
		("SEEDTEST_python", user_id)
	)
	page_id = cur.fetchone()[0]
	check("Page created", page_id is not None)

	cur.execute("DELETE FROM page_slugs WHERE slug LIKE 'seedtest-%'")
	cur.execute(
		"""INSERT INTO page_slugs (page_id, namespace, slug, type, is_canonical)
		   VALUES (%s, %s, %s, %s, %s)""",
		(page_id, "testuser0", "seedtest-python", "USER", True)
	)
	check("Page slug created", True)

	cur.execute("INSERT INTO tag_pages (tag_id, page_id) VALUES (%s, %s)", 
			 (tag_id, page_id))
	cur.execute("INSERT INTO page_permissions (page_id, user_token, permissions) VALUES (%s, %s, %s)", 
		 (page_id, user1_id, "READ"))

	cur.execute(
		"SELECT p.page_id, p.title, t.name FROM pages p "
		"JOIN tag_pages tp ON tp.page_id = p.page_id "
		"JOIN tags t ON t.id = tp.tag_id "
		"WHERE p.page_id = %s",
		(page_id,)
	)
	result = cur.fetchall()
	check("Page linked to tag", 
	   len(result) == 1 and result[0][2] == "SEEDTEST_python")

	cur.execute("DELETE FROM pages WHERE title LIKE 'SEEDTEST_forbidden%'")
	cur.execute(
		"INSERT INTO pages (title, owner_id, last_modified) VALUES (%s, %s, NOW()) RETURNING page_id",
		("SEEDTEST_forbidden_page", user_id)
	)
	forbidden_page_id = cur.fetchone()[0]
	check("Forbidden page created (no permission)", forbidden_page_id is not None)

	conn.commit()
	cur.close()
	conn.close()
	return results, {
	"user_id": user_id,
	"tag_id": tag_id,
	"page_id": page_id,
	"forbidden_page_id": forbidden_page_id,
	"namespace": "testuser0",
	"slug": "seedtest-python"
}
