import os
import sys
import time
import logging
import gc
import threading
import socket
import asyncio
from typing import TypedDict, Optional
import numpy as np
from PIL import Image, ImageOps, ImageEnhance, ImageFilter

logger = logging.getLogger("app.services.ocr_service")

class ExtractionResult(TypedDict):
    text: str
    page_count: int
    word_count: int

def get_memory_usage_mb() -> Optional[float]:
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)
    except ImportError:
        try:
            import resource
            # ru_maxrss is in KB on Linux
            return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024.0
        except Exception:
            return None

class OCRService:
    _reader = None
    _lock = threading.Lock()
    _init_error = None

    @classmethod
    def get_reader(cls):
        """Lazy-loaded, cached EasyOCR reader instance with lock and timeout protection."""
        t0 = time.time()
        logger.info("[OCR SERVICE] Entering get_reader()")

        if cls._reader is None:
            if cls._lock.locked():
                logger.info("[OCR SERVICE] EasyOCR reader cold start in progress in another thread. Waiting for lock/initialization to complete...")
            else:
                logger.info("[OCR SERVICE] EasyOCR reader not initialized. Acquiring singleton initialization lock...")
                
            with cls._lock:
                # Double-check pattern
                if cls._reader is None:
                    try:
                        import easyocr
                        import torch
                        from app import config
                        
                        logger.info("[OCR SERVICE] Lock acquired. Initializing EasyOCR Reader (cold start in progress)...")
                        
                        # Prevent PyTorch multi-threading deadlocks on resource-constrained containers
                        torch.set_num_threads(1)
                        torch.set_num_interop_threads(1)
                        
                        # Disable gradient calculation globally to save memory
                        torch.set_grad_enabled(False)
                        
                        # Set default socket timeout to prevent download requests from hanging forever
                        socket.setdefaulttimeout(15.0)
                        
                        # Log model caching directory and details
                        model_dir = os.path.join(easyocr.easyocr.MODULE_PATH, "model")
                        logger.info(f"[OCR SERVICE] EasyOCR cache directory: {easyocr.easyocr.MODULE_PATH}")
                        logger.info(f"[OCR SERVICE] EasyOCR search path: {model_dir}")
                        if os.path.exists(model_dir):
                            cached_files = os.listdir(model_dir)
                            logger.info(f"[OCR SERVICE] Existing cached model files: {cached_files}")
                        else:
                            logger.warning(f"[OCR SERVICE] Cached model files folder does not exist at path: {model_dir}")
                        
                        use_gpu = torch.cuda.is_available() if config.OCR_USE_GPU else False
                        langs = [lang.strip() for lang in config.OCR_LANGUAGES.split(",") if lang.strip()]
                        
                        # Define Reader thread target to enforce initialization timeouts
                        def init_reader():
                            try:
                                cls._reader = easyocr.Reader(
                                    langs, 
                                    gpu=use_gpu,
                                    download_enabled=False,
                                    verbose=False,
                                    quantize=True,
                                    model_storage_directory=model_dir
                                )
                                gc.collect()
                            except Exception as ex:
                                cls._init_error = ex
                        
                        cls._init_error = None
                        init_thread = threading.Thread(target=init_reader)
                        init_thread.daemon = True
                        
                        logger.info(f"[OCR SERVICE] Spawning thread to create Reader() with languages {langs} (GPU Enabled: {use_gpu})...")
                        t_init = time.time()
                        init_thread.start()
                        init_thread.join(timeout=120.0)
                        
                        if init_thread.is_alive():
                            logger.error("[OCR SERVICE] EasyOCR reader initialization timed out (cold start limit exceeded)!")
                            raise TimeoutError("EasyOCR Reader initialization timed out (exceeded 120s safety limit).")
                        
                        if cls._init_error:
                            logger.error(f"[OCR SERVICE] EasyOCR reader initialization thread failed: {str(cls._init_error)}")
                            raise cls._init_error
                        
                        gc.collect()
                        logger.info(f"[OCR SERVICE] Reader created successfully in {time.time() - t_init:.2f} seconds.")
                    except Exception as e:
                        logger.error(f"[OCR SERVICE] Failed to initialize EasyOCR library: {str(e)}", exc_info=True)
                        raise RuntimeError(f"OCR Reader engine failed to start: {str(e)}")
                else:
                    logger.info("[OCR SERVICE] Lock acquired. Reader was successfully initialized by the other thread.")
        
        logger.info(f"[OCR SERVICE] Returning Reader. Total get_reader time: {time.time() - t0:.2f} seconds.")
        return cls._reader

    @classmethod
    async def extract_text(cls, file_path: str, file_type: str) -> ExtractionResult:
        """Extracts text from files according to type parameters, falling back to OCR when needed."""
        # 5. Verify base uploads directory exists before OCR
        base_uploads = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
        if not os.path.exists(base_uploads):
            try:
                os.makedirs(base_uploads, exist_ok=True)
                logger.info(f"[OCR SERVICE] Base uploads directory verified and created at: {base_uploads}")
            except Exception as e:
                logger.error(f"[OCR SERVICE] Failed to create base uploads directory: {str(e)}")

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
            start_time = time.time()
            try:
                import pdfplumber
                text = ""
                page_count = 0
                
                with pdfplumber.open(file_path) as pdf:
                    page_count = len(pdf.pages)
                    logger.info(f"[OCR SERVICE] Started PDF extraction. Total pages: {page_count}")
                    for i, page in enumerate(pdf.pages):
                        page_text = page.extract_text()
                        if page_text and page_text.strip():
                            text += page_text + "\n"
                        else:
                            # PDF Page has no selectable text, fall back to OCR on the page image
                            logger.info(f"[OCR SERVICE] PDF page {i+1} has no selectable text. Executing image fallback OCR...")
                            try:
                                pil_img = page.to_image(resolution=150).original.convert('RGB')
                                width, height = pil_img.size
                                # Downscale large page images to save memory and avoid restarts on Render
                                max_dim = 1500
                                if width > max_dim or height > max_dim:
                                    ratio = max_dim / max(width, height)
                                    pil_img = pil_img.resize((int(width * ratio), int(height * ratio)), Image.Resampling.LANCZOS)
                                    logger.info(f"[OCR SERVICE] PDF page {i+1} image downscaled to {pil_img.size[0]}x{pil_img.size[1]} for memory safety.")
                                
                                img_arr = np.array(pil_img)
                                pil_img.close()
                                
                                reader = await asyncio.to_thread(cls.get_reader)
                                try:
                                    # Execute OCR in a thread pool with 30.0s timeout limit to prevent hangs
                                    ocr_results = await asyncio.wait_for(
                                        asyncio.to_thread(reader.readtext, img_arr, detail=0),
                                        timeout=30.0
                                    )
                                except asyncio.TimeoutError:
                                    logger.warning(f"[OCR WARNING] PDF Page {i+1} OCR execution timed out after 30 seconds.")
                                    ocr_results = []
                                ocr_text = " ".join(ocr_results)
                                if ocr_text.strip():
                                    text += ocr_text + "\n"
                                
                                del img_arr
                                gc.collect()
                            except Exception as ocr_err:
                                logger.exception(f"[OCR WARNING] Failed to OCR PDF Page {i+1}: {str(ocr_err)}")
                                text += f"[Page {i+1} OCR Extraction Failure]\n"
                
                elapsed = time.time() - start_time
                mem = get_memory_usage_mb()
                mem_str = f"{mem:.2f} MB" if mem is not None else "N/A"
                logger.info(f"[OCR SERVICE] PDF processing finished in {elapsed:.2f}s. Extracted characters: {len(text)}. Memory: {mem_str}")
                
                return {
                    "text": text,
                    "page_count": page_count,
                    "word_count": len(text.split())
                }
            except Exception as e:
                logger.exception("Failed to parse PDF file layout")
                raise RuntimeError(f"Failed to parse PDF file layout: {str(e)}")

        # 4. Image Documents (PNG, JPG, JPEG, WEBP, BMP)
        elif file_ext in ["png", "jpg", "jpeg", "webp", "bmp"]:
            start_time = time.time()
            try:
                # Validate file exists and get size
                file_size = os.path.getsize(file_path)
                logger.info(f"[OCR SERVICE] Image received for OCR: {file_path}")
                logger.info(f"[OCR SERVICE] Image file size: {file_size} bytes")

                # Validate file size
                if file_size <= 0:
                    raise ValueError("Invalid empty file uploaded.")
                
                from app import config
                pro_limit_bytes = config.PRO_PLAN_UPLOAD_LIMIT_MB * 1024 * 1024
                if file_size > pro_limit_bytes:
                    raise ValueError(f"File size exceeds the maximum limit of {config.PRO_PLAN_UPLOAD_LIMIT_MB} MB.")

                # Open and validate image format
                try:
                    with Image.open(file_path) as pil_img:
                        pil_img.load()
                        img_format = pil_img.format.upper() if pil_img.format else ""
                        width, height = pil_img.size
                except Exception as img_err:
                    raise ValueError(f"Invalid or corrupted image file: {str(img_err)}")

                logger.info(f"[OCR SERVICE] Image loaded & validated. Format: {img_format}, Dimensions: {width}x{height}")
                
                # Check supported format
                if img_format not in ["PNG", "JPEG", "JPG", "MPO", "WEBP", "BMP"]:
                    raise ValueError(f"Unsupported image format in file: {img_format}")

                with Image.open(file_path) as pil_img:
                    # Auto orientation if required (exif_transpose)
                    img = ImageOps.exif_transpose(pil_img)
                    width, height = img.size

                    # Downscale extremely large images to fit within max_dim (1500) to optimize for Render Free RAM (512MB)
                    max_dim = 1500
                    if width > max_dim or height > max_dim:
                        ratio = max_dim / max(width, height)
                        new_w = int(width * ratio)
                        new_h = int(height * ratio)
                        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                        width, height = img.size
                        logger.info(f"[OCR SERVICE] Downscaled large image to {width}x{height} to save memory.")
                    
                    # Upscale image only if it is small to preserve OCR accuracy
                    elif width < 1000 or height < 1000:
                        scale = 2
                        if width < 500 or height < 500:
                            scale = 3
                        img = img.resize((width * scale, height * scale), Image.Resampling.LANCZOS)
                        width, height = img.size
                        logger.info(f"[OCR SERVICE] Upscaled small image to {width}x{height} for accuracy.")

                    # Handle transparency (RGBA, LA, or P with transparency) safely
                    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                        composite = Image.alpha_composite(bg, img.convert("RGBA"))
                        img = composite.convert("RGB")
                        bg.close()
                        composite.close()
                    else:
                        img = img.convert("RGB")

                    # Convert to grayscale
                    img = img.convert("L")

                    # Increase contrast using autocontrast and enhancer
                    img = ImageOps.autocontrast(img)
                    enhancer = ImageEnhance.Contrast(img)
                    img = enhancer.enhance(2.0)

                    # Noise reduction (Median Filter size 3)
                    img = img.filter(ImageFilter.MedianFilter(size=3))

                    # Otsu Threshold calculation for soft thresholding band
                    img_arr = np.array(img)
                    try:
                        pixel_counts = np.bincount(img_arr.ravel(), minlength=256)
                        total_pixels = img_arr.size
                        p = pixel_counts / float(total_pixels)
                        q = np.cumsum(p)
                        bins = np.arange(256)
                        mu = np.cumsum(bins * p)
                        mu_g = mu[-1]
                        with np.errstate(divide='ignore', invalid='ignore'):
                            denom = q * (1.0 - q)
                            variance = (mu_g * q - mu) ** 2 / denom
                        variance[np.isnan(variance)] = 0.0
                        thresh = np.argmax(variance)
                    except Exception:
                        thresh = 127

                    # Adaptive Soft Thresholding (retains gradients for anti-aliasing edges)
                    low = max(0, thresh - 90)
                    high = min(255, thresh + 90)
                    span = high - low if high > low else 1
                    binary_arr = np.clip((img_arr - low) * 255.0 / span, 0, 255).astype(np.uint8)
                    del img_arr

                    # Dynamic Inversion (ensure black text on white background)
                    mean_val = np.mean(binary_arr)
                    if mean_val < 127:
                        binary_arr = 255 - binary_arr

                    preprocessed_img = Image.fromarray(binary_arr)
                    del binary_arr

                    # Sharpen edges using Unsharp Mask
                    preprocessed_img = preprocessed_img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
                    
                    preprocessed_arr = np.array(preprocessed_img)
                    
                    img.close()
                    preprocessed_img.close()
                    
                    logger.info(f"[OCR SERVICE] Image preprocessing complete. Reader requested.")
                    
                    # OCR Execution
                    logger.info(f"[OCR SERVICE] OCR started using EasyOCR Reader: dimensions={width}x{height}, format={file_ext}")
                    reader = await asyncio.to_thread(cls.get_reader)
                     
                    try:
                        # Execute OCR in a thread pool with 60.0s timeout limit to prevent hangs
                        ocr_results = await asyncio.wait_for(
                            asyncio.to_thread(reader.readtext, preprocessed_arr, detail=1),
                            timeout=60.0
                        )
                    except asyncio.TimeoutError:
                        logger.error(f"[OCR SERVICE] OCR execution timed out after 60 seconds for image: {file_path}")
                        raise RuntimeError("OCR processing timed out. The image might be too complex or server resources are constrained.")
                     
                    del preprocessed_arr
                    gc.collect()

                # Preserve Line Breaks
                blocks = []
                for res in ocr_results:
                    if len(res) == 3:
                        bbox, text_val, conf = res
                    elif len(res) == 2:
                        bbox, text_val = res
                        conf = 1.0
                    else:
                        continue
                    if not text_val or not text_val.strip():
                        continue
                        
                    xs = [pt[0] for pt in bbox]
                    ys = [pt[1] for pt in bbox]
                    ymin, ymax = min(ys), max(ys)
                    xmin, xmax = min(xs), max(xs)
                    
                    blocks.append({
                        "ymin": ymin,
                        "ymax": ymax,
                        "xmin": xmin,
                        "xmax": xmax,
                        "y_center": (ymin + ymax) / 2.0,
                        "height": ymax - ymin,
                        "text": text_val
                    })
                
                # Group into lines based on vertical overlap
                lines = []
                for block in sorted(blocks, key=lambda b: b["y_center"]):
                    placed = False
                    for line in lines:
                        line_ymin = min(b["ymin"] for b in line)
                        line_ymax = max(b["ymax"] for b in line)
                        line_height = line_ymax - line_ymin
                        
                        overlap_ymin = max(block["ymin"], line_ymin)
                        overlap_ymax = min(block["ymax"], line_ymax)
                        overlap = max(0.0, overlap_ymax - overlap_ymin)
                        
                        min_h = min(block["height"], line_height)
                        if min_h > 0 and (overlap / min_h) > 0.4:
                            line.append(block)
                            placed = True
                            break
                            
                    if not placed:
                        lines.append([block])
                
                # Sort horizontally within each line
                line_texts = []
                for line in lines:
                    sorted_line = sorted(line, key=lambda b: b["xmin"])
                    line_text = " ".join(b["text"] for b in sorted_line)
                    line_texts.append(line_text)
                    
                text = "\n".join(line_texts).strip()

                # If empty, return standard fallback
                if not text:
                    text = "No readable text detected in the uploaded image."

                elapsed_time = time.time() - start_time
                mem = get_memory_usage_mb()
                mem_str = f"{mem:.2f} MB" if mem is not None else "N/A"
                logger.info(f"[OCR SERVICE] OCR finished: {file_path}")
                logger.info(f"[OCR SERVICE] Extracted text length: {len(text)} characters")
                logger.info(f"[OCR SERVICE] Processing time: {elapsed_time:.2f} seconds")
                logger.info(f"[OCR SERVICE] Memory usage: {mem_str}")

                return {
                    "text": text,
                    "page_count": 1,
                    "word_count": len(text.split())
                }
            except Exception as e:
                elapsed_time = time.time() - start_time
                logger.exception(f"OCR execution failed for image {file_path} after {elapsed_time:.2f}s: {str(e)}")
                raise RuntimeError(f"Failed to OCR image file: {str(e)}")

        else:
            raise ValueError(f"Unsupported file type extension passed for text extraction: '{file_ext}'")
