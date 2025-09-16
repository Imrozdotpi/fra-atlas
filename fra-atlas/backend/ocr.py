# backend/ocr.py
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from pathlib import Path
from PIL import Image


def extract_text(file_path: str) -> str:
    """
    Extract text from PDF.
    1. Try pdfplumber (works for text-based PDFs).
    2. If no text found, fall back to OCR using Tesseract on images.
    """

    text_content = ""

    # 1. Try extracting with pdfplumber
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
    except Exception as e:
        print(f"[OCR] pdfplumber failed: {e}")

    # 2. Fallback: OCR with Tesseract if pdfplumber gave nothing
    if not text_content.strip():
        try:
            images = convert_from_path(file_path)
            for img in images:
                text_content += pytesseract.image_to_string(img) + "\n"
        except Exception as e:
            print(f"[OCR] Tesseract OCR failed: {e}")

    # 3. Final return
    text_content = text_content.strip()
    if not text_content:
        text_content = "NO_TEXT_EXTRACTED"

    return text_content
