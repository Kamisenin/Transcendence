# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    runner.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/08/02 18:00:30 by humontas          #+#    #+#              #
#    Updated: 2026/08/14 23:02:27 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import requests

from auth_tests import REGISTER_TESTS, LOGIN_TESTS, LOGOUT_TESTS
from search_tests import SEARCH_TESTS
from page_creation_tests import run_seed
from page_permission_tests import run_permission_tests


BASE_URL = "http://localhost:3000"

TEST_GROUPS = [
	("REGISTER", REGISTER_TESTS),
	("LOGIN", LOGIN_TESTS),
	("SEARCH", SEARCH_TESTS),
	("LOGOUT", LOGOUT_TESTS),
]

NEEDS_SESSION = [
	"Valid logout",
	"Query too short",
	"Valid query",
	"Valid query, non existant page",
]
 
valid_session_id = None
 
 
def run_test(test):
	global valid_session_id
 
	url = f"{BASE_URL}{test['endpoint']}"
	cookies = test.get("cookies")
	if test["name"] in NEEDS_SESSION:
		cookies = {"session_id": valid_session_id}
 
	if test["method"] == "POST":
		response = requests.post(url, json=test.get("payload", {}), cookies=cookies)
	else:
		response = requests.get(url, params=test.get("params", {}), cookies=cookies)
 
	if test["name"] == "Login valid":
		valid_session_id = response.cookies.get("session_id")
 
	if response.status_code == test["expected"]:
		print(f"{test['name']} ✅")
	else:
		print(f"{test['name']} ❌ (expected {test['expected']}, got {response.status_code})")
 
 
for group_name, tests in TEST_GROUPS:
	print(f"\n========== {group_name} ==========\n")
	for test in tests:
		run_test(test)

print(f"\n========== PAGE ==========\n")
seed_results, seed_data = run_seed()
for r in seed_results:
	if r["passed"]:
		print(f"{r['name']} ✅")
	else:
		print(f"{r['name']} ❌ {r['detail']}")

print(f"\n========== PERMISSIONS ==========\n")
permission_results = run_permission_tests()
for r in permission_results:
	if r["passed"]:
		print(f"{r['name']} ✅")
	else:
		print(f"{r['name']} ❌ {r['detail']}")

print(f"\n========== CLEANUP ==========\n")
login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
	"id": "testuser0",
	"password": "password123"
})
cleanup_session_id = login_response.cookies.get("session_id")
if cleanup_session_id:
	delete_response = requests.delete(
		f"{BASE_URL}/api/auth/delete",
		cookies={"session_id": cleanup_session_id}
	)
	if delete_response.status_code == 200:
		print("Clean up success ✅")
	else:
		print(f"Clean up failed ❌ (got {delete_response.status_code})")
else:
	print("Could not get session for cleanup")
