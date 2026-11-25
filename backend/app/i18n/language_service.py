import json
import os
import re
from typing import Dict, Any, Tuple

GLOSSARY_PATH = os.path.join(os.path.dirname(__file__), "tulu_glossary.json")

class LanguageService:
    def __init__(self):
        self.glossary = []
        if os.path.exists(GLOSSARY_PATH):
            try:
                with open(GLOSSARY_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.glossary = data.get("glossary", [])
            except Exception as e:
                print(f"Error loading Tulu glossary: {e}")

        # Tulu specific marker tokens (both Kannada script and romanized)
        self.tulu_markers = [
            "ದಾದ", "ದಾದ ಆಂಡ್", "ಎಂಚ ಉಲ್ಲರ್", "ಉಲ್ಲರಾ", "ಬೇನೆ", "ಗುಂಡಿಗೆ", "ಬಂಜಿ", "ನೆತ್ತೆರ್", "ತರೆ",
            "ಮರ್ದ್", "ವನಸ್", "ಆರಾಮ", "ಜೆಪ್ಪುಲೆ", "ಕುಲ್ಲುಲೆ", "ನೀರ್", "ಬೊಂಡ", "ಕಷಾಯ",
            "daada", "ancha", "ulleera", "bene", "mardu", "gundige", "vanas", "neer", "bonda"
        ]

        # Kannada specific marker words
        self.kannada_markers = [
            "ಹೇಗಿದ್ದೀರಿ", "ಹೇಗಿದೆ", "ಆರೋಗ್ಯ", "ಔಷಧ", "ಹೃದಯ", "ನೋವು", "ನಿದ್ರೆ", "ನೀರು", "ಊಟ",
            "ರಕ್ತದೊತ್ತಡ", "ವೈದ್ಯರು", "ಆಸ್ಪತ್ರೆ", "ಹೋಗಿ", "ವಿಶ್ರಾಂತಿ", "ತೆಗೆದುಕೊಳ್ಳಿ",
            "hegiddeera", "aarogya", "aushadha", "hrudaya", "novina"
        ]

    def detect_script(self, text: str) -> str:
        """Determines if the string contains Kannada unicode characters (U+0C80 to U+0CFF)."""
        kannada_chars = re.findall(r'[\u0C80-\u0CFF]', text)
        if len(kannada_chars) > 0:
            return "kannada"
        return "latin"

    def detect_language(self, text: str, user_preference: str = "en") -> Dict[str, Any]:
        """
        Classifies language into:
        - "kn": Kannada
        - "tcy": Tulu
        - "en": English
        - "kanglish": Romanized Kannada / Code-mixed
        """
        text_lower = text.strip().lower()
        if not text_lower:
            return {"language": user_preference, "confidence": 1.0}

        script = self.detect_script(text)

        # 1. Check for Tulu specific lexicon
        for marker in self.tulu_markers:
            if marker in text_lower:
                return {"language": "tcy", "confidence": 0.94, "dialect": "coastal_tulu"}

        # 2. Check for Kannada markers
        for km in self.kannada_markers:
            if km in text_lower:
                return {"language": "kn", "confidence": 0.92, "dialect": "kannada"}

        # 3. If Kannada script is present
        if script == "kannada":
            # Default to Kannada if no exclusive Tulu root matched
            return {"language": "kn", "confidence": 0.88}

        # 4. Check for Kanglish / Romanized Kannada
        kanglish_patterns = ["hegide", "nanna", "aaytu", "beku", "illa", "gottilla", "yavaga", "madodu", "oota"]
        if any(p in text_lower for p in kanglish_patterns):
            return {"language": "kanglish", "confidence": 0.85, "base": "kn"}

        # Default fallback to English or user's last confirmed preference
        return {"language": user_preference if user_preference in ["kn", "tcy"] else "en", "confidence": 0.90}

language_service = LanguageService()
