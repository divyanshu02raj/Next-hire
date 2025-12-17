import google.generativeai as genai
import os
import json
import pandas as pd
from dotenv import load_dotenv
import time

# --- Configuration ---
load_dotenv()
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    model = genai.GenerativeModel('gemini-flash-latest')
except KeyError:
    raise RuntimeError("GOOGLE_API_KEY not found in .env file.")

def generate_job_description(category: str) -> str:
    """Generates a detailed job description for a given job category."""
    print(f"Generating job description for category: '{category}'...")
    
    prompt = f"""
    You are an expert Senior Technical Recruiter and Hiring Manager.
    Your task is to write a single, detailed, and realistic job description for a "{category}" role.

    The job description should be comprehensive and include the following sections:
    - A brief company and role overview.
    - Key Responsibilities (in a bulleted list).
    - Required Skills and Qualifications (in a bulleted list).
    - Preferred Qualifications (in a bulleted list).

    Return ONLY the job description text. Do not add any extra explanations or introductory phrases.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"An error occurred while generating data for {category}: {e}")
        return "Error generating job description."

def main():
    """Main function to generate JDs, merge them, and save the new dataset."""
    
    # --- 1. Load the Raw Resume Dataset ---
    try:
        raw_filename = "UpdatedResumeDataSet.csv" # Pre-configured for the second dataset
        resume_col = "Resume"
        category_col = "Category"
        
        df = pd.read_csv(raw_filename)
        print(f"Successfully loaded '{raw_filename}' containing {len(df)} rows.")
        
    except FileNotFoundError:
        print(f"Error: The file '{raw_filename}' was not found.")
        print("Please download the 'Resume Dataset', rename it to 'Resume.csv', and place it in this directory.")
        return

    # --- 2. Generate Job Descriptions for Unique Categories ---
    unique_categories = df[category_col].unique()
    print(f"\nFound {len(unique_categories)} unique job categories. Generating descriptions...")
    
    jd_map = {}
    for category in unique_categories:
        jd_map[category] = generate_job_description(category)
        # Add a small delay to avoid hitting API rate limits
        time.sleep(1) 
        
    print("\nSuccessfully generated all job descriptions.")

    # --- 3. Merge JDs into the main DataFrame ---
    print("Merging generated job descriptions with resumes...")
    df['job_description'] = df[category_col].map(jd_map)
    
    # Clean up by removing any rows where JD generation failed
    df = df[df['job_description'] != "Error generating job description"]
    print(f"Dataset now contains {len(df)} rows with matched job descriptions.")

    # --- 4. Save the New, Complete Dataset ---
    output_df = df[[resume_col, 'job_description']]
    # Rename columns to be consistent with our next script
    output_df.rename(columns={resume_col: 'resume_text'}, inplace=True)

    output_filename = "resumes_with_jd.csv"
    output_df.to_csv(output_filename, index=False)
    
    print(f"\nData generation and merging complete!")
    print(f"New dataset with resumes and job descriptions saved to '{output_filename}'.")
    print("\nYou can now proceed to the next step: using 'data_labeler.py' on this new file.")

if __name__ == "__main__":
    main()
