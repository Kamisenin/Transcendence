from nltk.stem import SnowballStemmer

from utils.config import LANGUAGES

def stem_word(word: str, languages: list[str] = LANGUAGES) -> str:
	stemmers = {lang: SnowballStemmer(lang) for lang in languages}
	return min((s.stem(word) for s in stemmers.values()), key=len)