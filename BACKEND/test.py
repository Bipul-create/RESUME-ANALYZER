from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

resume = """
John Doe

Skills:
Python, Machine Learning, TensorFlow, SQL

Projects:
1. Loan Approval Prediction
2. House Price Prediction

Experience:
6 months ML Internship
"""

prompt = f"""
Extract information from this resume.

Return ONLY valid JSON.

Format:

{{
  "name": "",
  "skills": [],
  "projects": [],
  "experience": ""
}}

Resume:
{resume}
"""

response = model.generate_content(prompt)

print(response.text)