import spacy
from spacy.tokens import Span

nlp = spacy.load("en_core_web_sm")

def extract_entities(text):
    doc = nlp(text)

    villages = []
    names = []
    dates = []

    for ent in doc.ents:
        if ent.label_ == "GPE":      # Geo-political entities → village names
            villages.append(ent.text)
        elif ent.label_ == "PERSON": # Patta holder names
            names.append(ent.text)
        elif ent.label_ == "DATE":   # Claim dates
            dates.append(ent.text)

    return {
        "villages": list(set(villages)),
        "patta_holders": list(set(names)),
        "dates": list(set(dates))
    }
