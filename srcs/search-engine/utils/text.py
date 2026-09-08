# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    text.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/01 11:56:03 by humontas@st       #+#    #+#              #
#    Updated: 2026/09/08 20:28:44 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import nltk
from nltk.corpus import stopwords
nltk.download('stopwords')

from utils.config import LANGUAGES
from utils.stemmer import stem_word


def cut_query(query: str, languages: list[str] = LANGUAGES) -> list[str]:
	query = query.lower()
	query = query.replace(",", " ")
	words = query.split()
	words = [stem_word(word, languages) for word in words]
	return words