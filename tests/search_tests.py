# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    search_tests.py                                    :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/08/02 17:43:29 by humontas          #+#    #+#              #
#    Updated: 2026/08/02 17:59:23 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

SEARCH_TESTS = [
	{
		"name": "No session",
		"method": "GET",
		"endpoint": "/api/search",
		"params": {"query": "python"},
		"cookies": None,
		"expected": 401
	},

	{
		"name": "No query",
		"method": "GET",
		"endpoint": "/api/search",
		"params": {},
		"cookies": None,
		"expected": 400
	},

	{
		"name": "Query too short",
		"method": "GET",
		"endpoint": "/api/search",
		"params": {"query": "ia"},
		"expected": 400
	},

	{
		"name": "Valid query",
		"method": "GET",
		"endpoint": "/api/search",
		"params": {"query": "SEEDTEST_python"},
		"expected": 200
	},
]