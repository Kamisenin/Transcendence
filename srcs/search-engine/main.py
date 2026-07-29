# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    main.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas@student.42.fr <humontas>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/01 12:22:10 by humontas@st       #+#    #+#              #
#    Updated: 2026/07/06 16:26:52 by humontas@st      ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import time
from fastapi import FastAPI
from pydantic import BaseModel

from utils.text import cut_query
from scoring.ranking import rank_pages

app = FastAPI()

class SearchRequest(BaseModel):
	query: str
	items: list[dict]


@app.post("/search")
def search(request: SearchRequest):
	start = time.time()

	query_words = cut_query(request.query)
	result = rank_pages(query_words, request.items)

	duration_ms = (time.time() - start) * 1000
	print(f"⏱️ /search took {duration_ms:.2f} ms")

	return result
