# backend/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)

    # Core FRA claim fields
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    block = Column(String, nullable=True)
    village = Column(String, nullable=True)
    patta_holder = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    land_area = Column(String, nullable=True)
    status = Column(String, default="Pending")
    date = Column(String, nullable=True)

    # Geo coords
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    # Provenance / metadata
    source = Column(String, default="manual")   # e.g. "manual" or "uploaded"
    raw_ocr = Column(Text, nullable=True)       # JSON/text dump of OCR+NER results if uploaded

    created_at = Column(DateTime, default=datetime.utcnow)


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    block = Column(String, nullable=True)
    village = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
