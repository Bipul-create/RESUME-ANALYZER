import re  # Regular Expressions library text cleaning ke liye

def clean_extracted_text(text):
    """
    Yeh function resume ke extracted text se faltu characters,
    extra spaces aur lambi khali lines ko clean karega.
    """
    if not text:
        return ""
    
    # 1. Multiple spaces aur tabs ko single space mein badlein
    text = re.sub(r'[ \t]+', ' ', text)
    
    # 2. Consecutive newlines ko control karein (max 2 newlines hi rahein)
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    
    # 3. Text ke shuruat aur aakhri ke faltu spaces ko hatayein
    text = text.strip()
    
    return text

# --- TESTING LOGIC FOR DAY 4 ---
if __name__ == "__main__":
    print("Utils.py is ready! Testing data cleaning logic...")
    
    # Ek ganda text jisme bohot spaces aur newlines hain:
    ganda_text = "   Python    Developer   \n\n\n\n   Experience:   2 Years   "
    saaf_text = clean_extracted_text(ganda_text)
    
    print("\n--- Before Cleaning ---")
    print(ganda_text)
    print("\n--- After Cleaning ---")
    print(saaf_text)