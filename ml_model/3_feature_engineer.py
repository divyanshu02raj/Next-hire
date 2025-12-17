import google.generativeai as genai
import os
import json
import pandas as pd
import re
from dotenv import load_dotenv
import time

# --- Configuration ---
load_dotenv()
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel('gemini-flash-latest')
except KeyError:
    raise RuntimeError("GOOGLE_API_KEY not found in .env file.")

# --- Helper function to extract years of experience using AI ---
def extract_years_experience(text: str) -> int:
    """Uses the LLM to extract the total years of experience from a text snippet."""
    prompt = f"""
    Analyze the following text from a resume or job description. Your single task is to identify the total number of years of professional experience mentioned.
    Return ONLY a single integer representing that number.

    - If you see a range like "5-7 years", return the lower number (5).
    - If you see "8+ years", return 8.
    - If no specific number of years is mentioned (e.g., a student resume), return 0.

    Text:
    ---
    {text}
    ---

    Years of Experience (return one integer only):
    """
    try:
        response = model.generate_content(prompt)
        # Clean the response to ensure it's just a number
        cleaned_text = re.sub(r'\D', '', response.text)
        if cleaned_text:
            return int(cleaned_text)
        return 0
    except Exception:
        # If AI fails for any reason, default to 0
        return 0

# --- Helper function to calculate keyword match score ---
def calculate_keyword_score(resume_text: str, jd_text: str) -> int:
    """Calculates a simple keyword match score."""
    try:
        # Use AI to identify keywords first
        jd_keywords_prompt = f"Extract the top 15 most important technical skills and keywords from this job description. Return them as a JSON list of strings. Job Description: {jd_text}"
        jd_response = model.generate_content(jd_keywords_prompt, generation_config=genai.types.GenerationConfig(response_mime_type="application/json"))
        required_keywords = set(json.loads(jd_response.text))

        if not required_keywords:
            return 50 # Default score if no keywords are found in JD

        # Count how many required keywords are in the resume
        found_keywords = sum(1 for keyword in required_keywords if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', resume_text.lower()))
        
        score = int((found_keywords / len(required_keywords)) * 100)
        return score
    except Exception:
        return 50 # Default score on failure

def main():
    """Main function to load data, engineer features, and save the new dataset."""
    
    # --- 1. Load the Labeled Dataset ---
    try:
        labeled_filename = "labeled_ats_data.csv"
        df = pd.read_csv(labeled_filename)
        df.dropna(inplace=True)
        print(f"Successfully loaded '{labeled_filename}' containing {len(df)} rows.")
        
    except FileNotFoundError:
        print(f"Error: The file '{labeled_filename}' was not found.")
        print("Please ensure you have successfully run 'data_labeler.py' first.")
        return

    # --- 2. Engineer New Features ---
    print("\nStarting advanced feature engineering. This will take some time...")
    
    # Initialize new columns
    df['keyword_score'] = 0
    df['experience_gap'] = 0

    for index, row in df.iterrows():
        print(f"Processing row {index + 1}/{len(df)}...")
        
        # Feature 1: Keyword Matching Score
        df.at[index, 'keyword_score'] = calculate_keyword_score(row['resume_text'], row['job_description'])
        time.sleep(1) # Rate limit

        # Feature 2: Experience Gap Analysis
        jd_exp = extract_years_experience(row['job_description'])
        time.sleep(1) # Rate limit
        resume_exp = extract_years_experience(row['resume_text'])
        time.sleep(1) # Rate limit
        
        df.at[index, 'experience_gap'] = resume_exp - jd_exp

    print("\nFeature engineering complete.")

    # --- 3. Save the Feature-Rich Dataset ---
    output_filename = "featured_ats_data.csv"
    df.to_csv(output_filename, index=False)
    
    print(f"\nSuccessfully created new feature-rich dataset!")
    print(f"Saved to '{output_filename}'.")
    print("This file is now ready for the final model training step.")

if __name__ == "__main__":
    main()

