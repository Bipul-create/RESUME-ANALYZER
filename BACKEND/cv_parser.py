import pypdf

def extract_text_from_pdf(pdf_path_or_file):
    try:
        if hasattr(pdf_path_or_file, "read"):
            reader = pypdf.PdfReader(pdf_path_or_file)
        else:
            with open(pdf_path_or_file, "rb") as f:
                reader = pypdf.PdfReader(f)

                text = ""
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

                return text

        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        return text

    except Exception as e:
        print("PDF ERROR:", e)
        return ""