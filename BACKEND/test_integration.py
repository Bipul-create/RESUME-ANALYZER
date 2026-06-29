from cv_parser import extract_text_from_pdf
from utils import clean_extracted_text
from evaluator import evaluate_resume

def run_day5_integration():
    print("====================================================")
    print("🔄 Day 5: RUNNING COMPLETE INTEGRATION TEST...")
    print("====================================================\n")
    
    resume_file = "sample.pdf" 
    print(f"[STEP 1] Reading data from: {resume_file}...")
    raw_text = extract_text_from_pdf(resume_file)
    
    # Agar PDF sach mein corrupt hai, toh test rukna nahi chahiye, hum fallback lagayenge
    if "Error" in raw_text or not raw_text.strip() or "incorrect header" in raw_text.lower():
        print("\n⚠️ Warning: Aapki PDF file corrupt hai ya khali hai.")
        print("💡 But tension mat lo! Hum ek Dummy Resume Text use karke AI test kar lete hain...\n")
        cleaned_resume = """
        Bipul Baibhav Kumar
        Python Developer
        Skills: Python, Git, GitHub, Streamlit, REST APIs, SQL.
        Projects: Built an AI CV Analyser project that parses PDFs and ranks resumes using Gemini API.
        Experience: 1 year academic and hands-on project building experience.
        """
    else:
        print("[STEP 2] Cleaning raw text data...")
        cleaned_resume = clean_extracted_text(raw_text)
    
    # Test karne ke liye target Job Description (JD)
    dummy_jd = """
    We are looking for a Software Developer who has skills in Python, 
    building applications, understands version control like Git, 
    and has experience with APIs.
    """
    print(f"[STEP 3] Target Job Description Loaded.")
    
    print("[STEP 4] Connecting with Gemini 2.5-Flash AI... Please wait...")
    ai_response = evaluate_resume(cleaned_resume, dummy_jd)
    
    if "error" not in ai_response:
        s = ai_response.get("skill", 0)
        p = ai_response.get("project", 0)
        e = ai_response.get("experience", 0)
        q = ai_response.get("quality", 0)
        
        final_score = (0.40 * s) + (0.25 * p) + (0.20 * e) + (0.15 * q)
        
        print("\n================ 🎉 TEST RESULTS ===================")
        print(f"📊 Skill Match Score       : {s}%")
        print(f"📊 Project Relevance Score : {p}%")
        print(f"📊 Experience Score        : {e}%")
        print(f"📊 Resume Quality Score     : {q}%")
        print("----------------------------------------------------")
        print(f"🔥 FINAL WEIGHTED SCORE    : {final_score:.2f} / 100")
        print(f"📝 AI FEEDBACK REPORT      : {ai_response.get('feedback')}")
        print("====================================================")
    else:
        print(f"\n❌ Test Failed: {ai_response['error']}")

if __name__ == "__main__":
    run_day5_integration()