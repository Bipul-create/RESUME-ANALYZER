from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import zipfile
import tempfile
import os
import io
import csv
from groq import Groq
from dotenv import load_dotenv

from cv_parser import extract_text_from_pdf
from utils import clean_extracted_text
from evaluator import evaluate_resume, understand_role
from report_generator import generate_pdf
from semantic_search import compute_semantic_score, extract_behavioral_signals

load_dotenv()

app = FastAPI(title="TalentIQ API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────

class EvaluationRequest(BaseModel):
    resume_text: str
    job_description: str

class ChatRequest(BaseModel):
    question: str
    rankings: list

class RoleUnderstandRequest(BaseModel):
    job_description: str


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"status": "running", "message": "TalentIQ AI Backend v2.0"}


# ── Role Understanding ────────────────────────────────────────────────────────

@app.post("/understand-role")
def understand_role_endpoint(request: RoleUnderstandRequest):
    """
    Analyze the job description to understand what the role really needs.
    Proves semantic understanding, not keyword matching.
    """
    result = understand_role(request.job_description)
    return {"success": True, "role_understanding": result}


# ── Single Evaluate ───────────────────────────────────────────────────────────

@app.post("/evaluate")
def evaluate(request: EvaluationRequest):
    cleaned_resume = clean_extracted_text(request.resume_text)
    result = evaluate_resume(cleaned_resume, request.job_description)

    if "error" in result:
        return {"success": False, "error": result["error"]}

    skill = result.get("skill", 0)
    project = result.get("project", 0)
    experience = result.get("experience", 0)
    quality = result.get("quality", 0)

    # Semantic score
    sem = compute_semantic_score(cleaned_resume, request.job_description)

    # Hybrid final score: LLM (85%) + semantic (15%)
    llm_score = (0.40 * skill) + (0.25 * project) + (0.20 * experience) + (0.15 * quality)
    final_score = (0.85 * llm_score) + (0.15 * sem["semantic_score"])

    return {
        "success": True,
        "skill_match": skill,
        "project_relevance": project,
        "experience_score": experience,
        "resume_quality": quality,
        "semantic_score": sem["semantic_score"],
        "confidence_lower": sem["confidence_lower"],
        "confidence_upper": sem["confidence_upper"],
        "final_score": round(final_score, 2),
        "feedback": result.get("feedback", "")
    }


# ── Bulk Evaluate ZIP ─────────────────────────────────────────────────────────

@app.post("/bulk-evaluate-zip")
async def bulk_evaluate_zip(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    candidates = []

    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, file.filename)

        with open(zip_path, "wb") as buffer:
            buffer.write(await file.read())

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)

        for root, dirs, files in os.walk(temp_dir):
            for pdf_file in files:
                if not pdf_file.lower().endswith(".pdf"):
                    continue

                pdf_path = os.path.join(root, pdf_file)

                try:
                    resume_text = extract_text_from_pdf(pdf_path)
                    cleaned_resume = clean_extracted_text(resume_text)

                    # 1. LLM Evaluation
                    result = evaluate_resume(cleaned_resume, job_description)
                    if "error" in result:
                        print(f"Evaluator error for {pdf_file}: {result['error']}")
                        continue

                    skill     = result.get("skill", 0)
                    project   = result.get("project", 0)
                    experience= result.get("experience", 0)
                    quality   = result.get("quality", 0)

                    llm_score = (
                        (0.40 * skill)
                        + (0.25 * project)
                        + (0.20 * experience)
                        + (0.15 * quality)
                    )

                    # 2. Semantic Score
                    sem = compute_semantic_score(cleaned_resume, job_description)

                    # 3. Hybrid Final Score — LLM 85% + Semantic 15%
                    final_score = (0.85 * llm_score) + (0.15 * sem["semantic_score"])

                    # 4. Behavioral Signals
                    behavioral = extract_behavioral_signals(cleaned_resume)

                    # 5. Recommendation
                    if final_score >= 85:
                        recommendation = "Highly Recommended"
                    elif final_score >= 70:
                        recommendation = "Recommended"
                    elif final_score >= 50:
                        recommendation = "Consider"
                    else:
                        recommendation = "Not Recommended"

                    candidates.append({
                        "name": pdf_file,
                        "score": round(final_score, 2),
                        "skillMatch": skill,
                        "project_relevance": project,
                        "experience_score": experience,
                        "resume_quality": quality,

                        # Semantic search results
                        "semanticScore": sem["semantic_score"],
                        "confidenceLower": sem["confidence_lower"],
                        "confidenceUpper": sem["confidence_upper"],

                        # Behavioral signals
                        "behavioralSignals": behavioral["signals"],
                        "topSignal": behavioral["top_signal"],

                        # LLM extras
                        "whyFits": result.get("why_fits", ""),
                        "experienceLevel": result.get("experience_level", "Unknown"),
                        "cultureSignals": result.get("culture_signals", []),

                        "recommendation": recommendation,
                        "feedback": result.get("feedback", ""),
                        "strengths": result.get("strengths", []),
                        "weaknesses": result.get("weaknesses", []),
                        "missingSkills": result.get("missing_skills", [])
                    })

                except Exception as e:
                    print(f"Error processing {pdf_file}: {e}")

    candidates.sort(key=lambda x: x["score"], reverse=True)

    return {"success": True, "rankings": candidates}


# ── Bulk Evaluate (multi-file upload) ────────────────────────────────────────

@app.post("/bulk-evaluate")
async def bulk_evaluate(
    files: list[UploadFile] = File(...),
    job_description: str = Form(...)
):
    candidates = []

    for file in files:
        try:
            resume_text = extract_text_from_pdf(file.file)
            cleaned_resume = clean_extracted_text(resume_text)
            result = evaluate_resume(cleaned_resume, job_description)

            if "error" in result:
                continue

            skill     = result.get("skill", 0)
            project   = result.get("project", 0)
            experience= result.get("experience", 0)
            quality   = result.get("quality", 0)

            llm_score = (0.40 * skill) + (0.25 * project) + (0.20 * experience) + (0.15 * quality)
            sem = compute_semantic_score(cleaned_resume, job_description)
            final_score = (0.85 * llm_score) + (0.15 * sem["semantic_score"])
            behavioral = extract_behavioral_signals(cleaned_resume)

            candidates.append({
                "name": file.filename,
                "skill_match": skill,
                "project_relevance": project,
                "experience_score": experience,
                "resume_quality": quality,
                "semantic_score": sem["semantic_score"],
                "final_score": round(final_score, 2),
                "feedback": result.get("feedback", ""),
                "strengths": result.get("strengths", []),
                "weaknesses": result.get("weaknesses", []),
                "missing_skills": result.get("missing_skills", []),
                "behavioral_signals": behavioral["signals"],
            })

        except Exception as e:
            print(f"Error processing {file.filename}: {e}")

    candidates.sort(key=lambda x: x["final_score"], reverse=True)
    return {"success": True, "total_candidates": len(candidates), "rankings": candidates}


# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/chat")
def chat(request: ChatRequest):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    prompt = f"""
You are TalentIQ's AI Recruitment Assistant.

You are helping a recruiter analyze candidates.

Candidate Rankings:
{request.rankings}

Recruiter's Question:
{request.question}

Instructions:
- Answer only using the ranking information provided.
- Be professional and concise.
- If comparing candidates, explain why.
- If recommending someone, justify the recommendation.
- Maximum 150 words.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return {"answer": response.choices[0].message.content}

    except Exception as e:
        print("CHATBOT ERROR:", e)
        return {"answer": "Sorry, I couldn't process your request."}


# ── PDF Report ────────────────────────────────────────────────────────────────

@app.post("/download-report")
async def download_report(data: dict):
    rankings = data.get("rankings", [])
    job_description = data.get("job_description", "")
    filename = "TalentIQ_Report.pdf"
    generate_pdf(filename, rankings, job_description)
    return FileResponse(filename, media_type="application/pdf", filename="TalentIQ_Report.pdf")


# ── CSV Export (for hackathon submission) ─────────────────────────────────────

@app.post("/export-csv")
async def export_csv(data: dict):
    """
    Export ranked candidates as CSV in hackathon submission format.
    Includes semantic scores and behavioral signals.
    """
    rankings = data.get("rankings", [])

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Rank",
        "Candidate Name",
        "Final Score",
        "Skill Match",
        "Project Relevance",
        "Experience Score",
        "Resume Quality",
        "Semantic Score",
        "Confidence Range",
        "Experience Level",
        "Top Behavioral Signal",
        "Recommendation",
        "Key Strengths",
        "Missing Skills",
        "Why They Fit",
        "Feedback"
    ])

    for idx, c in enumerate(rankings, 1):
        name = c.get("name", "").replace(".pdf", "").replace("_", " ")
        confidence = f"{c.get('confidenceLower', '')} - {c.get('confidenceUpper', '')}"
        strengths = " | ".join(c.get("strengths", []))
        missing = " | ".join(c.get("missingSkills", []))

        writer.writerow([
            idx,
            name,
            c.get("score", ""),
            c.get("skillMatch", ""),
            c.get("project_relevance", ""),
            c.get("experience_score", ""),
            c.get("resume_quality", ""),
            c.get("semanticScore", ""),
            confidence,
            c.get("experienceLevel", ""),
            c.get("topSignal", ""),
            c.get("recommendation", ""),
            strengths,
            missing,
            c.get("whyFits", ""),
            c.get("feedback", "")
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=TalentIQ_Rankings.csv"}
    )
