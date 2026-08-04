# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    matching.py                                        :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas@student.42.fr <humontas>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/08 16:10:02 by humontas@st       #+#    #+#              #
#    Updated: 2026/07/08 21:45:51 by humontas@st      ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from rapidfuzz import fuzz


def score_words(query_words: list[str], target_words: list[str]) -> float:
	scores = []
	for word in query_words:
		best = 0
		for target in target_words:
			if word == target:
				current = 120
			else:
				current = fuzz.ratio(word, target)
			if current > best:
				best = current
		scores.append(best)
	return sum(scores) / len(scores) if scores else 0