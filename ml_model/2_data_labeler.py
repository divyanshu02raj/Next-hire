import pandas as pd
import re
from sentence_transformers import SentenceTransformer, util
import torch
import numpy as np

# --- Configuration ---
# This is the name of the model we'll use to generate text embeddings.
# It's a highly efficient model, perfect for this task.
MODEL_NAME = 'all-MiniLM-L6-v2'

# --- Helper function for cleaning text ---
def clean_text(text):
    """A simple function to clean text by removing special characters."""
    if not isinstance(text, str):
        return ""
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text) # Remove special characters
    text = text.lower() # Convert to lowercase
    text = re.sub(r'\s+', ' ', text).strip() # Remove extra whitespace
    return text

def main():
    """Main function to load, clean, and label the dataset."""
    
    # --- 1. Load the Raw Dataset ---
    # This script is now configured to use the output of jd_generator.py
    try:
        raw_filename = "resumes_with_jd.csv" # <-- CONFIGURED for your new file
        resume_col = "resume_text"
        jd_col = "job_description"
        
        df = pd.read_csv(raw_filename)
        print(f"Successfully loaded '{raw_filename}' containing {len(df)} rows.")
        
    except FileNotFoundError:
        print(f"Error: The file '{raw_filename}' was not found.")
        print("Please ensure you have successfully run 'jd_generator.py' first.")
        return

    # --- 2. Clean and Prepare the Data ---
    print("Cleaning and preparing text data...")
    df.dropna(subset=[resume_col, jd_col], inplace=True)
    df['cleaned_resume'] = df[resume_col].apply(clean_text)
    df['cleaned_jd'] = df[jd_col].apply(clean_text)
    
    # Filter out any rows that became empty after cleaning
    df = df[(df['cleaned_resume'] != "") & (df['cleaned_jd'] != "")]
    print(f"Dataset reduced to {len(df)} rows after cleaning and removing empty entries.")

    if len(df) == 0:
        print("No valid data remains after cleaning. Exiting.")
        return

    # --- 3. Label the Data using Semantic Similarity ---
    print(f"Loading the Sentence Transformer model ('{MODEL_NAME}'). This may take a moment...")
    model = SentenceTransformer(MODEL_NAME)
    
    print("Generating embeddings for resumes and job descriptions...")
    # Convert text to embeddings (numerical vectors)
    resume_embeddings = model.encode(df['cleaned_resume'].tolist(), convert_to_tensor=True, show_progress_bar=True)
    jd_embeddings = model.encode(df['cleaned_jd'].tolist(), convert_to_tensor=True, show_progress_bar=True)
    
    print("Calculating cosine similarity scores...")
    # Calculate cosine similarity between each pair of embeddings
    cosine_scores = util.cos_sim(resume_embeddings, jd_embeddings)
    
    # The result is a matrix; we only need the diagonal (score for resume_i vs jd_i)
    scores = np.diag(cosine_scores.cpu().numpy())
    
    # Scale the scores from [-1, 1] to [0, 100] to be our match_score label
    df['match_score'] = ((scores + 1) / 2 * 100).astype(int)
    
    print("Similarity scoring complete.")

    # --- 4. Save the Labeled Dataset ---
    # We'll save the original text and the new score
    output_df = df[[resume_col, jd_col, 'match_score']]
    output_filename = "labeled_ats_data.csv"
    output_df.to_csv(output_filename, index=False)
    
    print(f"\nLabeling complete!")
    print(f"Labeled dataset with {len(output_df)} rows saved to '{output_filename}'.")
    print("This file is now ready for Phase 2: Feature Engineering and Model Training.")


if __name__ == "__main__":
    main()