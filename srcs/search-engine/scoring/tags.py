# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    tags.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas@student.42.fr <humontas>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/01 12:38:09 by humontas@st       #+#    #+#              #
#    Updated: 2026/07/08 21:45:23 by humontas@st      ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from utils.matching import score_words
from utils.stemmer import stem_word
from utils.config import LANGUAGES

def score_page(query_words: list[str], page_tags: list[str]) -> float:
	page_tags_stemmed = [stem_word(tag, LANGUAGES) for tag in page_tags]
	return score_words(query_words, page_tags_stemmed)
