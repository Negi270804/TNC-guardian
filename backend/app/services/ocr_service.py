import os
import sys
import inspect
from typing import TypedDict, Optional
import numpy as np
from PIL import Image

class ExtractionResult(TypedDict):
    text: str
    page_count: int
    word_count: int

class OCRService:
    _reader = None

    @classmethod
    def get_reader(cls):
        """Lazy-loaded, cached EasyOCR reader instance to conserve RAM/VRAM resource pools."""
        if cls._reader is None:
            try:
                import easyocr
                import torch
                use_gpu = torch.cuda.is_available()
                print(f"[OCR SERVICE] Initializing EasyOCR Reader (GPU Enabled: {use_gpu})...")
                cls._reader = easyocr.Reader(['en'], gpu=use_gpu)
            except Exception as e:
                print(f"[OCR SERVICE] Failed to initialize EasyOCR library: {str(e)}", file=sys.stderr)
                raise RuntimeError(f"OCR Reader engine failed to start: {str(e)}")
        return cls._reader

    @classmethod
    async def extract_text(cls, file_path: str, file_type: str) -> ExtractionResult:
        """Extracts text from files according to type parameters, falling back to OCR when needed."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Source file not found at path: {file_path}")

        file_ext = file_type.lower().strip('.')
        
        # 1. TXT Documents
        if file_ext == "txt":
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                return {
                    "text": text,
                    "page_count": 1,
                    "word_count": len(text.split())
                }
            except Exception as e:
                raise RuntimeError(f"Failed to read TXT file: {str(e)}")

        # 2. DOCX Documents
        elif file_ext == "docx":
            try:
                import docx
                doc = docx.Document(file_path)
                full_text = []
                for para in doc.paragraphs:
                    full_text.append(para.text)
                # Parse tables too for completeness
                for table in doc.tables:
                    for row in table.rows:
                        row_text = [cell.text for cell in row.cells]
                        full_text.append(" | ".join(row_text))
                
                text = "\n".join(full_text)
                return {
                    "text": text,
                    "page_count": 1,
                    "word_count": len(text.split())
                }
            except Exception as e:
                raise RuntimeError(f"Failed to extract DOCX file text: {str(e)}")

        # 3. PDF Documents
        elif file_ext == "pdf":
            try:
                import pdfplumber
                text = ""
                page_count = 0
                
                with pdfplumber.open(file_path) as pdf:
                    page_count = len(pdf.pages)
                    for i, page in enumerate(pdf.pages):
                        page_text = page.extract_text()
                        if page_text and page_text.strip():
                            text += page_text + "\n"
                        else:
                            # PDF Page has no selectable text, fall back to OCR on the page image
                            try:
                                pil_img = page.to_image(resolution=150).original.convert('RGB')
                                img_arr = np.array(pil_img)
                                reader = cls.get_reader()
                                ocr_results = reader.readtext(img_arr, detail=0)
                                ocr_text = " ".join(ocr_results)
                                if ocr_text.strip():
                                    text += ocr_text + "\n"
                            except Exception as ocr_err:
                                print(f"[OCR WARNING] Failed to OCR PDF Page {i+1}: {str(ocr_err)}", file=sys.stderr)
                                text += f"[Page {i+1} OCR Extraction Failure]\n"
                
                return {
                    "text": text,
                    "page_count": page_count,
                    "word_count": len(text.split())
                }
            except Exception as e:
                raise RuntimeError(f"Failed to parse PDF file layout: {str(e)}")

        # 4. Image Documents (PNG, JPG, JPEG)
        elif file_ext in ["png", "jpg", "jpeg"]:
            try:
                reader = cls.get_reader()
                ocr_results = reader.readtext(file_path, detail=0)
                text = "\n".join(ocr_results)
                return {
                    "text": text,
                    "page_count": 1,
                    "word_count": len(text.split())
                }
            except Exception as e:
                raise RuntimeError(f"Failed to OCR image file: {str(e)}")

        else:
            raise ValueError(f"Unsupported file type extension passed for text extraction: '{file_ext}'")
