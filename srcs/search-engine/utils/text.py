# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    text.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas@student.42.fr <humontas>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/01 11:56:03 by humontas@st       #+#    #+#              #
#    Updated: 2026/07/06 16:43:19 by humontas@st      ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import nltk
from nltk.corpus import stopwords
nltk.download('stopwords')

from utils.config import LANGUAGES
from utils.stemmer import stem_word


def cut_query(query: str, languages: list[str] = LANGUAGES) -> list[str]:

	stop_words = set(word for lang in languages for word in stopwords.words(lang))

	query = query.lower()
	query = query.replace(",", " ")

	words = query.split()

	words = [word for word in words if word not in stop_words]
	words = [stem_word(word, languages) for word in words]
	return words