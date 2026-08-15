# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    page_permission_tests.py                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/08/02 17:23:46 by humontas          #+#    #+#              #
#    Updated: 2026/08/14 22:53:47 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from playwright.sync_api import sync_playwright
from page_creation_tests import run_seed


BASE_URL = "http://localhost:3000"

def run_permission_tests():
	results = []
 
	def check(name, condition, detail=""):
		results.append({"name": name, "passed": condition, "detail": detail})
 
	seed_results, seed_data = run_seed()
	if not seed_data:
		check("Seed data available", False, "run_seed() failed, aborting")
		return results
 
	namespace = seed_data["namespace"]
	slug = seed_data["slug"]
	edit_url = f"{BASE_URL}/wiki/{namespace}/{slug}/edit"
	view_url = f"{BASE_URL}/wiki/{namespace}/{slug}"
 
	with sync_playwright() as p:
		browser = p.chromium.launch()
		page = browser.new_page()
 
		# testuser1 n'a que READ sur cette page -> l'édition doit être refusée
		page.goto(f"{BASE_URL}/login")
		page.fill('input[name="id"]', "testuser1")
		page.fill('input[name="password"]', "password123")
		page.click('button[type="submit"]')
		page.wait_for_url(BASE_URL + "/")
 
		page.goto(edit_url)
		page.wait_for_load_state("networkidle")
 
		check(
			"READ-only user blocked from edit page",
			page.url == view_url,
			f"expected redirect to {view_url}, got {page.url}"
		)
 
		browser.close()
 
	return results
 
 
if __name__ == "__main__":
	for r in run_permission_tests():
		if r["passed"]:
			print(f"{r['name']} ✅")
		else:
			print(f"{r['name']} ❌ {r['detail']}")
