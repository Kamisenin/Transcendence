# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    config.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: humontas <humontas@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/07/01 14:18:21 by humontas@st       #+#    #+#              #
#    Updated: 2026/09/08 20:29:35 by humontas         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import os
import json


_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(_root, "config.json")) as file:
	_config = json.load(file)

LANGUAGES = _config["languages"]
LIMIT = _config["limit"]
SCORE_THRESHOLD = _config["score_threshold"]
TITLE_WEIGHT = _config["title_weight"]
STOPWORD_WEIGHT = _config["stopword_weight"]