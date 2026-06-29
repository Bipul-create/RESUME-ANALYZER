import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def evaluate_resume(resume_text, job_description):
    key = os.getenv("GROQ_API_KEY")
    print("Backend key starts with:", key[:12] if key else "NO KEY")

    client = Groq(api_key=key)
    resume_text = resume_text[:6000]
    job_description = job_description[:2000]

    prompt = f"""
    You are a senior HR recruiter with 15 years of hiring experience.

    Evaluate the candidate realistically against the job description.

    Scoring Guidelines:
    - 90-100 = Excellent match
    - 80-89 = Strong match
    - 70-79 = Good match
    - 60-69 = Average match
    - 40-59 = Weak match
    - 0-39 = Poor match

    Important Rules:
    - Do NOT give scores below 40 unless the resume is almost completely unrelated.
    - Consider transferable skills.
    - Consider projects.
    - Consider internships as experience.
    - Reward matching technical skills.
    - Evaluate like a real recruiter, not an exam checker.

    Resume:
    {resume_text}

    Job Description:
    {job_description}

    Return ONLY valid JSON.

    Format:

    {{
      "skill": 85,
      "project": 82,
      "experience": 75,
      "quality": 90,

      "strengths": [
        "Strength 1",
        "Strength 2",
        "Strength 3"
      ],

      "weaknesses": [
        "Weakness 1",
        "Weakness 2"
      ],

      "missing_skills": [
        "Skill 1",
        "Skill 2",
        "Skill 3"
      ],

      "feedback": "Write a professional recruiter summary in 2-3 sentences.",

      "why_fits": "One sentence explaining why this candidate semantically fits the role beyond keywords.",

      "experience_level": "Junior | Mid-Level | Senior | Lead",

      "culture_signals": ["signal1", "signal2"]
    }}

    Rules:
    - Return ONLY JSON.
    - Do not use markdown.
    - Do not use backticks.
    - strengths must contain exactly 3 items.
    - weaknesses must contain exactly 2 items.
    - missing_skills should contain the important missing skills from the JD.
    - culture_signals: 2-3 short phrases describing work style (e.g. "fast-paced", "self-starter", "team player").
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )

        result = response.choices[0].message.content
        print("RAW GROQ RESPONSE:")
        print(result)

        result = result.replace("```json", "").replace("```", "").strip()
        data = json.loads(result)
        return data

    except Exception as e:
        print("GROQ ERROR:", e)
        return {
            "skill": 50,
            "project": 50,
            "experience": 50,
            "quality": 50,
            "feedback": "AI service temporarily unavailable.",
            "why_fits": "",
            "experience_level": "Unknown",
            "culture_signals": []
        }


def understand_role(job_description: str) -> dict:
    """
    Analyze the job description itself to extract structured role understanding.
    This proves the system understands context, not just keywords.
    """
    key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=key)

    prompt = f"""
    You are an expert job analyst. Analyze this job description and extract structured information.

    Job Description:
    {job_description[:2000]}

    Return ONLY valid JSON with this exact format:

    {{
      "role_title": "Inferred job title",
      "experience_required": "e.g. 3-5 years",
      "seniority_level": "Junior | Mid-Level | Senior | Lead | Executive",
      "required_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "nice_to_have": ["skill1", "skill2"],
      "culture_fit": ["trait1", "trait2", "trait3"],
      "role_summary": "One sentence summarizing what this role is really about.",
      "bias_flags": ["any biased terms found like rockstar, ninja, young, etc — empty array if none"]
    }}

    Rules:
    - Return ONLY JSON. No markdown. No backticks.
    - required_skills: exactly 5 most important technical skills
    - culture_fit: 3 inferred cultural traits
    - bias_flags: flag terms like rockstar, ninja, young, energetic, native speaker
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        result = response.choices[0].message.content
        result = result.replace("```json", "").replace("```", "").strip()
        return json.loads(result)

    except Exception as e:
        print("ROLE UNDERSTANDING ERROR:", e)
        return {
            "role_title": "Unknown Role",
            "experience_required": "Not specified",
            "seniority_level": "Unknown",
            "required_skills": [],
            "nice_to_have": [],
            "culture_fit": [],
            "role_summary": "Could not analyze role.",
            "bias_flags": []
        }
