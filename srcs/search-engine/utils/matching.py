# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    matching.py                                        :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/08 16:10:02 by humontas@st       #+#    #+#              #
#    Updated: 2026/09/08 20:29:56 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from rapidfuzz import fuzz
from nltk.corpus import stopwords
from utils.config import LANGUAGES, STOPWORD_WEIGHT

_STOP_WORDS = set(w for lang in LANGUAGES for w in stopwords.words(lang))

def score_words(query_words: list[str], target_words: list[str]) -> float:
	total_score = 0.0
	total_weight = 0.0
	for word in query_words:
		weight = STOPWORD_WEIGHT if word in _STOP_WORDS else 1.0
		best = 0
		for target in target_words:
			if word == target:
				current = 120
			elif target.startswith(word) or word.startswith(target):
				current = 110
			elif word in target or target in word:
				current = 100
			else:
				current = fuzz.ratio(word, target)
			if current > best:
				best = current
		total_score += best * weight
		total_weight += weight
	return total_score / total_weight if total_weight else 0