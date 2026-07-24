import os
import sys
import asyncio
import time
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ocr_service import OCRService

# Create test images folder
TEST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_images")
os.makedirs(TEST_DIR, exist_ok=True)

def get_test_font(size=24):
    try:
        # Try loading standard Arial on Windows, fallback to default
        return ImageFont.truetype("arial.ttf", size)
    except IOError:
        try:
            return ImageFont.truetype("LiberationSans-Regular.ttf", size)
        except IOError:
            return ImageFont.load_default()

def generate_test_images():
    print("--- Generating Programmatic Test Images ---")
    
    # 1. Small screenshot (Dark mode, small text)
    # 300x200, simulating dark-mode mobile notification/popup
    small_path = os.path.join(TEST_DIR, "small_screenshot.png")
    img_small = Image.new("RGB", (400, 200), color=(30, 30, 40)) # dark background
    draw = ImageDraw.Draw(img_small)
    font = get_test_font(18)
    # White/light gray text
    draw.text((20, 40), "Auto-Renew Subscription Plan:", fill=(255, 255, 255), font=font)
    draw.text((20, 80), "This plan will automatically renew.", fill=(220, 220, 220), font=font)
    draw.text((20, 120), "Cancel anytime inside settings.", fill=(200, 200, 200), font=font)
    img_small.save(small_path)
    print(f"Generated small screenshot at {small_path}")

    # 2. Large screenshot (Light mode desktop view)
    # 1920x1080 screen layout with multiple lines of legal text
    large_path = os.path.join(TEST_DIR, "large_screenshot.png")
    img_large = Image.new("RGB", (1920, 1080), color=(245, 245, 247)) # light background
    draw = ImageDraw.Draw(img_large)
    font_title = get_test_font(36)
    font_body = get_test_font(28)
    # Dark text
    draw.text((100, 100), "TERMS OF SERVICE AND DISPUTE RESOLUTION", fill=(20, 20, 20), font=font_title)
    draw.text((100, 200), "Section 14: Arbitration Agreement", fill=(50, 50, 50), font=font_body)
    
    body_text = (
        "Please read this section carefully as it affects your rights. "
        "All disputes arising under these Terms shall be resolved exclusively through binding arbitration "
        "administered by the American Arbitration Association in accordance with its rules."
    )
    # Wrap text manually for the screenshot simulation
    draw.text((100, 280), "Please read this section carefully as it affects your rights.", fill=(80, 80, 80), font=font_body)
    draw.text((100, 330), "All disputes arising under these Terms shall be resolved exclusively through", fill=(80, 80, 80), font=font_body)
    draw.text((100, 380), "binding arbitration administered by the American Arbitration Association.", fill=(80, 80, 80), font=font_body)
    
    img_large.save(large_path)
    print(f"Generated large screenshot at {large_path}")

    # 3. Blurry screenshot (Moderate blur applied)
    # 800x400 with text, then Gaussian blur applied
    blurry_path = os.path.join(TEST_DIR, "blurry_screenshot.jpg")
    img_blurry = Image.new("RGB", (800, 400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img_blurry)
    font = get_test_font(26)
    draw.text((50, 100), "LIMITATION OF LIABILITY WARNING", fill=(0, 0, 0), font=font)
    draw.text((50, 160), "Our liability is limited to the maximum extent", fill=(50, 50, 50), font=font)
    draw.text((50, 220), "permitted by applicable law.", fill=(50, 50, 50), font=font)
    # Apply Gaussian Blur (simulating out-of-focus photo or low-quality compression)
    img_blurry = img_blurry.filter(ImageFilter.GaussianBlur(radius=1.5))
    img_blurry.save(blurry_path)
    print(f"Generated blurry screenshot at {blurry_path}")

    # 4. High-resolution image (Simulated scanned webp document)
    # 2400x3000 high-res document format
    highres_path = os.path.join(TEST_DIR, "high_res_image.webp")
    img_highres = Image.new("RGB", (2400, 3000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img_highres)
    font_header = get_test_font(60)
    font_text = get_test_font(48)
    
    draw.text((150, 200), "PRIVACY POLICY & DATA SHARING", fill=(0, 0, 0), font=font_header)
    draw.text((150, 400), "1. Information We Collect:", fill=(50, 50, 50), font=font_text)
    draw.text((150, 500), "We collect personal information such as name, email address, and billing info.", fill=(80, 80, 80), font=font_text)
    draw.text((150, 600), "2. Third-Party Data Sharing:", fill=(50, 50, 50), font=font_text)
    draw.text((150, 700), "We do not sell your personal data to third parties.", fill=(80, 80, 80), font=font_text)
    
    img_highres.save(highres_path)
    print(f"Generated high-resolution image at {highres_path}")
    
    return [
        (small_path, "small", ["automatically renew", "anytime"]),
        (large_path, "large", ["Arbitration", "affects your rights"]),
        (blurry_path, "blurry", ["LIMITATION", "liability", "permitted"]),
        (highres_path, "highres", ["PRIVACY", "personal information", "third parties"])
    ]

async def verify_pipeline():
    test_cases = generate_test_images()
    print("\n--- Running OCR Pipeline Verification Tests ---")
    
    all_passed = True
    for file_path, name, expected_words in test_cases:
        print(f"\nTesting {name.upper()} Image: {os.path.basename(file_path)}...")
        file_ext = os.path.splitext(file_path)[1].lstrip('.')
        
        try:
            start_time = time.time()
            result = await OCRService.extract_text(file_path, file_ext)
            elapsed = time.time() - start_time
            
            extracted_text = result["text"]
            word_count = result["word_count"]
            
            print(f"OCR Extraction completed in {elapsed:.2f}s.")
            print(f"Word count: {word_count}, Char count: {len(extracted_text)}")
            print("--- Extracted Text ---")
            print(extracted_text)
            print("----------------------")
            
            # Check expectations
            missing_keywords = []
            for kw in expected_words:
                if kw.lower() not in extracted_text.lower():
                    missing_keywords.append(kw)
            
            if missing_keywords:
                print(f"[FAIL] Missing expected keywords: {missing_keywords}")
                all_passed = False
            else:
                print(f"[PASS] All expected keywords found!")
                
        except Exception as e:
            print(f"[ERROR] OCR processing raised an exception: {str(e)}")
            import traceback
            traceback.print_exc()
            all_passed = False
            
    print("\n==================================================")
    if all_passed:
        print("ALL OCR VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
    else:
        print("SOME OCR VERIFICATION TESTS FAILED. CHECK LOGS.")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(verify_pipeline())
