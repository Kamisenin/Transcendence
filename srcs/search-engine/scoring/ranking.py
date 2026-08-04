# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    ranking.py                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas@student.42.fr <humontas>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/01 15:47:17 by humontas@st       #+#    #+#              #
#    Updated: 2026/07/08 21:46:46 by humontas@st      ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from scoring.tags import score_page
from scoring.titles import score_title
from utils.config import LIMIT, SCORE_THRESHOLD, TITLE_WEIGHT


def rank_pages(query_words: list[str], pages: list[dict]) -> list[dict]:
	for page in pages:
		tag_score = score_page(query_words, page["tags"])
		title_score = score_title(query_words, page["title"])
		page["score"] = tag_score + (title_score * TITLE_WEIGHT)
	pages = sorted(pages, key=lambda p: p["score"], reverse=True)
	pages = [page for page in pages if page["score"] >= SCORE_THRESHOLD]
	return pages[:LIMIT]