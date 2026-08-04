# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    titles.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas@student.42.fr <humontas>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/01 15:42:46 by humontas@st       #+#    #+#              #
#    Updated: 2026/07/08 21:49:45 by humontas@st      ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from utils.matching import score_words
from utils.config import LANGUAGES
from utils.text import cut_query


def score_title(query_words: list[str], title: str) -> float:
	title_words = cut_query(title, LANGUAGES)
	return score_words(query_words, title_words)