import os
import json
import time
import logging
import threading
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("translation_service")

# Translation cache path
CACHE_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_FILE = os.path.join(CACHE_DIR, "translations_cache.json")

# In-memory translation store: _cache[target_lang][source_text] = translated_text
_cache = {}
_cache_lock = threading.RLock()
_cache_dirty = False
_last_save_time = time.time()

# Supported language mapping: UI Code -> Translation API language code
LANGUAGE_MAP = {
    "EN": "en",
    "TA": "ta",
    "HI": "hi",
    "TE": "te",
    "KN": "kn",
    "ML": "ml",
    "BN": "bn",
    "MR": "mr",
    "GU": "gu",
    "PA": "pa",
    "OR": "or",
    "AS": "as",
    "UR": "ur",
    "SA": "sa",
    "KOK": "gom",       # Konkani
    "NE": "ne",
    "KS": "kas",       # Kashmiri
    "SD": "sd",
    "MAI": "mai",      # Maithili
    "MNI": "mni-Mtei", # Manipuri
    "BDO": "as",       # Bodo
    "SAT": "sat",      # Santali
    "DGO": "doi",      # Dogri
    "FR": "fr",
    "DE": "de",
    "ES": "es",
    "PT": "pt",
    "IT": "it",
    "NL": "nl",
    "RU": "ru",
    "ZH": "zh-CN",
    "JA": "ja",
    "KO": "ko",
    "AR": "ar",
    "TR": "tr",
    "FA": "fa",
    "ID": "id",
    "MS": "ms",
    "TH": "th",
    "VI": "vi",
    "PL": "pl",
    "UK": "uk",
    "EL": "el",
    "HE": "he",
    "SV": "sv",
    "DA": "da",
    "NO": "no",
    "FI": "fi"
}

# Pre-seeded core dictionary for Tamil (TA) to give 0ms instant UI rendering
SEED_TAMIL_DICTIONARY = {
    "Home": "முகப்பு",
    "Courses": "படிப்புகள்",
    "Colleges": "கல்லூரிகள்",
    "Domains": "துறைகள்",
    "Exams": "தேர்வுகள்",
    "Study materials": "படிப்பு பொருட்கள்",
    "Study Materials": "படிப்பு பொருட்கள்",
    "Reviews": "மதிப்புரைகள்",
    "Rankings": "தரவரிசைகள்",
    "Careers": "தொழில் வாய்ப்புகள்",
    "Placements": "வேலைவாய்ப்புகள்",
    "Jobs": "பணிகள்",
    "Internships": "பயிற்சிகள்",
    "Admissions": "சேர்க்கைகள்",
    "Scholarships": "உதவித்தொகை",
    "Facilities": "வசதிகள்",
    "Prep": "தயாரிப்பு",
    "Entrance Prep": "நுழைவுத் தேர்வு தயாரிப்பு",
    "Compare": "ஒப்பிடுக",
    "Reviews & Compare": "மதிப்புரைகள் மற்றும் ஒப்பீடு",
    "Log-in": "உள்நுழைய",
    "Sign Up": "பதிவு செய்க",
    "Sign In": "உள்நுழைக",
    "Select Preferred Language": "விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
    "Search courses, colleges, domains...": "படிப்புகள், கல்லூரிகள், துறைகளைத் தேடுங்கள்...",
    "Search": "தேடுக",
    "Overview": "கண்ணோட்டம்",
    "Subjects": "பாடங்கள்",
    "Preparation": "தயாரிப்பு",
    "Fees": "கட்டணம்",
    "Companies": "நிறுவனங்கள்",
    "Mentors": "வழிகாட்டிகள்",
    "Eligibility": "தகுதி",
    "Skills you build": "நீங்கள் வளர்க்கும் திறன்கள்",
    "Career scope": "தொழில் வாய்ப்பு",
    "Save pathway": "பாதையைச் சேமிக்கவும்",
    "Build my pathway": "எனது பாதையை உருவாக்குங்கள்",
    "Find colleges": "கல்லூரிகளைக் கண்டறியவும்",
    "All Languages": "அனைத்து மொழிகள்",
    "Indian Regional": "இந்திய பிராந்திய மொழிகள்",
    "International": "சர்வதேச மொழிகள்",
    "Admissions 2026 live": "சேர்க்கை 2026 நேரலையில்",
    "Languages": "மொழிகள்",
    "Active:": "செயலில் உள்ளது:",
    "Close": "மூடுக",
    "Clear": "அழிக்கவும்",
    "Apply Now": "இப்போது விண்ணப்பிக்கவும்",
    "View Details": "விவரங்களைக் காண்க",
    "Explore More": "மேலும் ஆராயுங்கள்",
    "Explore Courses": "படிப்புகளை ஆராயுங்கள்",
    "Explore Colleges": "கல்லூரிகளை ஆராயுங்கள்",
    "Explore Domains": "துறைகளை ஆராயுங்கள்",
    "User Portal / Login": "பயனர் போர்டல் / உள்நுழைவு",
    "About Us": "எங்களை பற்றி",
    "Contact Info": "தொடர்பு தகவல்",
    "Filter by": "வடிகட்டவும்",
    "All": "அனைத்தும்",
    "Engineering": "பொறியியல்",
    "Medicine": "மருத்துவம்",
    "Management": "மேலாண்மை",
    "Arts & Science": "கலை மற்றும் அறிவியல்",
    "Law": "சட்டம்",
    "Design": "வடிவமைப்பு"
}


def load_cache():
    """Loads persistent translation cache from disk and merges."""
    global _cache, _cache_dirty
    with _cache_lock:
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    disk_data = json.load(f)
                for lang, entries in disk_data.items():
                    if lang not in _cache:
                        _cache[lang] = {}
                    _cache[lang].update(entries)
                logger.info(f"Loaded {sum(len(v) for v in _cache.values())} cached translations across {len(_cache)} languages.")
            except Exception as e:
                logger.warning(f"Failed to load translation cache: {e}")

        # Seed Tamil cache if empty or missing entries
        if "ta" not in _cache:
            _cache["ta"] = {}
        for k, v in SEED_TAMIL_DICTIONARY.items():
            if k not in _cache["ta"]:
                _cache["ta"][k] = v
                _cache_dirty = True


def save_cache(force=False):
    """Flushes translation cache to disk safely."""
    global _cache_dirty, _last_save_time
    with _cache_lock:
        now = time.time()
        if not _cache_dirty and not force:
            return

        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(_cache, f, ensure_ascii=False, indent=2)
            _cache_dirty = False
            _last_save_time = now
            logger.info(f"Translation cache saved to disk: {CACHE_FILE}")
        except Exception as e:
            logger.error(f"Failed to save translation cache: {e}")


import atexit
atexit.register(save_cache, force=True)

# Initialize cache at startup
load_cache()


def normalize_lang_code(code):
    """Normalizes input language code to ISO format."""
    if not code:
        return "en"
    clean = code.strip()
    upper = clean.upper()
    if upper in LANGUAGE_MAP:
        return LANGUAGE_MAP[upper]
    lower = clean.lower()
    if lower in LANGUAGE_MAP.values():
        return lower
    return lower


def _translate_with_google_api(text_list, target_lang, source_lang="en", api_key=None):
    """Translates text list via official Google Cloud Translation REST API."""
    if not api_key:
        return None
    try:
        url = f"https://translation.googleapis.com/language/translate/v2?key={api_key}"
        payload = {
            "q": text_list,
            "target": target_lang,
            "source": source_lang,
            "format": "text"
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            translations = res_data.get("data", {}).get("translations", [])
            return [t.get("translatedText", "") for t in translations]
    except Exception as e:
        logger.warning(f"Google Cloud Translation API error: {e}")
        return None


def _translate_with_web_client(text, target_lang, source_lang="en"):
    """Translates a single string using Google Web translation endpoint."""
    try:
        clean = text.strip()
        if not clean or clean.isdigit():
            return clean
        url = f"https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl={source_lang}&tl={target_lang}&q={urllib.parse.quote(clean)}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "*/*"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list) and len(data) > 0:
                if isinstance(data[0], list) and len(data[0]) > 0:
                    return data[0][0]
                elif isinstance(data[0], str):
                    return data[0]
            elif isinstance(data, str):
                return data
    except Exception as e:
        logger.debug(f"Web client translation error for '{text[:20]}': {e}")
    return None


def _translate_with_deep_translator(text, target_lang, source_lang="en"):
    """Translates a single string using deep_translator GoogleTranslator."""
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        result = translator.translate(text)
        return result
    except Exception as e:
        logger.debug(f"deep_translator GoogleTranslator error for '{text[:20]}': {e}")
        return None


def _translate_with_mymemory(text, target_lang, source_lang="en"):
    """Translates a single string using MyMemory API fallback."""
    try:
        url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(text)}&langpair={source_lang}|{target_lang}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (CampNova-App)"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("responseStatus") == 200:
                translated = data.get("responseData", {}).get("translatedText")
                if translated and not translated.startswith("MYMEMORY WARNING"):
                    return translated
    except Exception as e:
        logger.debug(f"MyMemory fallback error for '{text[:20]}': {e}")
    return None


def translate_single_uncached(text, target_lang, source_lang="en"):
    """Attempts multi-tier translation for a single string with reliable fallbacks."""
    clean_text = text.strip()
    if not clean_text or clean_text.isdigit():
        return text

    # Tier 1: Check official Google Cloud API key if provided in env
    api_key = os.environ.get("GOOGLE_TRANSLATE_API_KEY") or os.environ.get("TRANSLATION_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if api_key:
        res = _translate_with_google_api([clean_text], target_lang, source_lang, api_key)
        if res and len(res) == 1 and res[0]:
            return res[0]

    # Tier 2: Try Web Client endpoint
    translated = _translate_with_web_client(clean_text, target_lang, source_lang)
    if translated and translated.strip():
        return translated

    # Tier 3: Try deep_translator library
    translated = _translate_with_deep_translator(clean_text, target_lang, source_lang)
    if translated and translated.strip():
        return translated

    # Tier 4: Try MyMemory fallback
    translated = _translate_with_mymemory(clean_text, target_lang, source_lang)
    if translated and translated.strip():
        return translated

    # Safe fallback: return original text without breaking
    return clean_text


def translate_batch(texts, target_lang_code, source_lang_code="en"):
    """
    Translates a list of strings to target language.
    Checks memory/disk cache first, translates missing items in parallel,
    updates cache, and returns a dictionary { source_text: translated_text }.
    """
    target_iso = normalize_lang_code(target_lang_code)
    source_iso = normalize_lang_code(source_lang_code)

    results = {}
    if not texts:
        return results

    # If target is English or source == target, return identity mapping
    if target_iso == "en" and source_iso == "en":
        for t in texts:
            results[t] = t
        return results

    missing_texts = []

    with _cache_lock:
        if target_iso not in _cache:
            _cache[target_iso] = {}
        target_dict = _cache[target_iso]

        for text in texts:
            if not isinstance(text, str):
                continue
            trimmed = text.strip()
            if not trimmed:
                results[text] = text
                continue
            if trimmed.isdigit():
                results[text] = text
                continue

            if trimmed in target_dict:
                results[text] = target_dict[trimmed]
            else:
                missing_texts.append(trimmed)

    # Deduplicate missing texts
    unique_missing = list(set(missing_texts))

    if unique_missing:
        logger.info(f"Translating {len(unique_missing)} uncached phrases to '{target_iso}'...")
        global _cache_dirty

        translated_map = {}

        # 1. Check official Google API batch translation first if key is present
        api_key = os.environ.get("GOOGLE_TRANSLATE_API_KEY") or os.environ.get("TRANSLATION_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if api_key and len(unique_missing) > 0:
            for i in range(0, len(unique_missing), 50):
                chunk = unique_missing[i:i+50]
                api_res = _translate_with_google_api(chunk, target_iso, source_iso, api_key)
                if api_res and len(api_res) == len(chunk):
                    for src, trans in zip(chunk, api_res):
                        if trans:
                            translated_map[src] = trans

        # 2. Translate remaining missing items in parallel using ThreadPoolExecutor
        remaining_missing = [t for t in unique_missing if t not in translated_map]

        if remaining_missing:
            max_workers = min(20, max(2, len(remaining_missing)))
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_text = {
                    executor.submit(translate_single_uncached, txt, target_iso, source_iso): txt
                    for txt in remaining_missing
                }
                for future in as_completed(future_to_text):
                    src_text = future_to_text[future]
                    try:
                        res = future.result()
                        translated_map[src_text] = res if res else src_text
                    except Exception as e:
                        logger.warning(f"Worker translation failed for '{src_text[:20]}': {e}")
                        translated_map[src_text] = src_text

        # Update cache safely
        with _cache_lock:
            for src, trans in translated_map.items():
                _cache[target_iso][src] = trans
            _cache_dirty = True

        save_cache(force=False)

    # Assemble full results for all requested texts
    with _cache_lock:
        target_dict = _cache.get(target_iso, {})
        for text in texts:
            if not isinstance(text, str):
                continue
            trimmed = text.strip()
            if not trimmed:
                results[text] = text
            elif trimmed in target_dict:
                results[text] = target_dict[trimmed]
            else:
                results[text] = text

    return results


def get_cache_stats():
    """Returns statistics about cached translations."""
    with _cache_lock:
        return {
            "total_languages": len(_cache),
            "cached_entries": {lang: len(entries) for lang, entries in _cache.items()},
            "total_phrases": sum(len(entries) for entries in _cache.values())
        }

def get_language_bundle(target_lang):
    """Returns the full dictionary of translations for a target language."""
    target_iso = normalize_lang_code(target_lang)
    with _cache_lock:
        if target_iso not in _cache:
            _cache[target_iso] = {}
        return dict(_cache.get(target_iso, {}))

