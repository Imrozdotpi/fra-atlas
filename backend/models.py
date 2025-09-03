from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class FRADocument(Base):
    __tablename__ = "fra_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    village = Column(String)
    patta_holder = Column(String)
    date = Column(String)
    extracted_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
