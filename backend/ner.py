import spacy
import re

nlp = spacy.load("en_core_web_sm")

def extract_entities(text):
    doc = nlp(text)

    villages = []
    names = []
    dates = []

    # --------------------------
    # SpaCy-based entity extraction
    # --------------------------
    for ent in doc.ents:
        if ent.label_ == "GPE":      # Geo-political entities → village names
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

    # --------------------------
    # Final structured output
    # --------------------------
    return {
        "villages": list(set(villages)),
        "patta_holders": list(set(names)),
        "dates": list(set(dates)),
        "ifr_number": ifr_match.group(1).strip() if ifr_match else None,
        "area": area_match.group(1).strip() if area_match else None,
        "claim_status": status_match.group(1).strip() if status_match else None,
    }

