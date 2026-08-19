# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    auth_tests.py                                      :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/24 19:29:49 by humontas          #+#    #+#              #
#    Updated: 2026/07/24 21:08:28 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

REGISTER_TESTS = [
	{
		"name": "Register valid",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "test0@test.com",
			"password": "password123",
			"accountId": "testuser0"
		},
		"expected": 201
	},

	{
		"name": "Already used email",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "test0@test.com",
			"password": "password123",
			"accountId": "testuser1"
		},
		"expected": 409
	},

	{
		"name": "Already used accountId",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "test1@test.com",
			"password": "password123",
			"accountId": "testuser0"
		},
		"expected": 409
	},
	
	{
		"name": "No email",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"password": "password123",
			"accountId": "testuser2"
		},
		"expected": 400
	},

	{
		"name": "No password",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "test2@test.com",
			"accountId": "testuser3"
		},
		"expected": 400
	},

	{
		"name": "No accountId",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "test3@test.com",
			"password": "password123"
		},
		"expected": 400
	},

	{
		"name": "Empty email",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "",
			"password": "password123",
			"accountId": "testuser4"
		},
		"expected": 400
	},

		{
		"name": "Empty password",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "test4@test.com",
			"password": "",
			"accountId": "testuser5"
		},
		"expected": 400
	},

	{
		"name": "Empty accountId",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {
			"email": "test5@test.com",
			"password": "password123",
			"accountId": ""
		},
		"expected": 400
	},

	{
		"name": "Empty payload",
		"method": "POST",
		"endpoint": "/api/auth/register",
		"payload": {},
		"expected": 400
	}
]

LOGIN_TESTS = [
	{
		"name": "Login valid",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {
			"id": "testuser0",
			"password": "password123"
		},
		"expected": 200
	},

	{
		"name": "Wrong password",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {
			"id": "testuser0",
			"password": "wrongpassword"
		},
		"expected": 401
	},

	{
		"name": "Unknown user",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {
			"id": "unknownuser",
			"password": "password123"
		},
		"expected": 401
	},

	{
		"name": "No id",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {
			"password": "password123"
		},
		"expected": 400
	},

	{
		"name": "No password",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {
			"id": "testuser0"
		},
		"expected": 400
	},

	{
		"name": "Empty id",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {
			"id": "",
			"password": "password123"
		},
		"expected": 400
	},

	{
		"name": "Empty password",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {
			"id": "testuser0",
			"password": ""
		},
		"expected": 400
	},

	{
		"name": "Empty payload",
		"method": "POST",
		"endpoint": "/api/auth/login",
		"payload": {},
		"expected": 400
	}
]

LOGOUT_TESTS = [
	{
	"name": "Valid logout",
	"method": "POST",
	"endpoint": "/api/auth/logout",
	"payload": {},
	"expected": 200
	},
	
	{
		"name": "Logout without session cookie",
		"method": "POST",
		"endpoint": "/api/auth/logout",
		"payload": {},
		"expected": 400
	},

	{
		"name": "Logout with empty session cookie",
		"method": "POST",
		"endpoint": "/api/auth/logout",
		"payload": {},
		"cookies": {"session_id": ""},
		"expected": 400
	},

	{
		"name": "Logout with fake/unknown session cookie",
		"method": "POST",
		"endpoint": "/api/auth/logout",
		"payload": {},
		"cookies": {"session_id": "00000000-0000-0000-0000-000000000000"},
		"expected": 200
	}
]