# backend/ner.py
import spacy
import re

# Load SpaCy model once
nlp = spacy.load("en_core_web_sm")


def extract_entities(text: str):
    """
    Extract entities from OCR text using SpaCy + regex.
    Returns a dict of fields aligned to Claim schema.
    """

    doc = nlp(text)

    villages = []
    names = []
    dates = []

    # --------------------------
    # SpaCy-based entity extraction
    # --------------------------
    for ent in doc.ents:
        if ent.label_ == "GPE":      # Geo-political entities → potential villages
            villages.append(ent.text)
        elif ent.label_ == "PERSON": # Patta holder names
            names.append(ent.text)
        elif ent.label_ == "DATE":   # Claim dates
            dates.append(ent.text)

    # --------------------------
    # Regex-based extraction for FRA fields
    # --------------------------
    village_match = re.search(r"Village:\s*([A-Za-z\s]+)", text, re.IGNORECASE)
    if village_match:
        villages.append(village_match.group(1).strip())

    patta_match = re.search(r"Patta Holder:\s*([A-Za-z\s]+)", text, re.IGNORECASE)
    if patta_match:
        names.append(patta_match.group(1).strip())

    date_match = re.search(r"(\d{1,2}[-/][A-Za-z]{3,9}[-/]\d{4})", text)
    if date_match:
        dates.append(date_match.group(1).strip())

    ifr_match = re.search(r"IFR Number:\s*([A-Za-z0-9-]+)", text, re.IGNORECASE)
    area_match = re.search(r"Area:\s*([0-9]+.*)", text, re.IGNORECASE)
    status_match = re.search(r"Claim Status:\s*([A-Za-z]+)", text, re.IGNORECASE)
    state_match = re.search(r"State:\s*([A-Za-z\s]+)", text, re.IGNORECASE)
    district_match = re.search(r"District:\s*([A-Za-z\s]+)", text, re.IGNORECASE)

    # --------------------------
    # Final structured output
    # --------------------------
    return {
        # Normalized fields (map to Claim model)
        "state": state_match.group(1).strip() if state_match else None,
        "district": district_match.group(1).strip() if district_match else None,
        "villages": list(set(villages)),
        "patta_holders": list(set(names)),
        "dates": list(set(dates)),
        "ifr_number": ifr_match.group(1).strip() if ifr_match else None,
        "land_area": area_match.group(1).strip() if area_match else None,
        "status": status_match.group(1).strip() if status_match else None,

        # Keep raw lists too (frontend/backend can decide how to use them)
        "raw_entities": {
            "villages": villages,
            "patta_holders": names,
            "dates": dates,
        },
    }
