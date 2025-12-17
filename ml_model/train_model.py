import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import scipy.sparse as sp
import numpy as np

def main():
    """Main function to load featured data, train, evaluate, and save the final model."""
    
    # --- 1. Load the Feature-Rich Dataset ---
    try:
        featured_filename = "featured_ats_data.csv"
        df = pd.read_csv(featured_filename)
        df.dropna(subset=['resume_text', 'job_description', 'match_score'], inplace=True)
        print(f"Successfully loaded '{featured_filename}' containing {len(df)} rows.")
        
    except FileNotFoundError:
        print(f"Error: The file '{featured_filename}' was not found.")
        print("Please ensure you have successfully run 'feature_engineer.py' first.")
        return

    # --- 2. Advanced Feature Engineering: Combining TF-IDF and Custom Features ---
    print("\nStarting final feature engineering...")
    
    # We still need to vectorize the text data
    tfidf_resume = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_jd = TfidfVectorizer(stop_words='english', max_features=5000)

    resume_vectors = tfidf_resume.fit_transform(df['resume_text'])
    jd_vectors = tfidf_jd.fit_transform(df['job_description'])
    
    # Get our custom-engineered numerical features
    custom_features = df[['keyword_score', 'experience_gap']].values
    
    # Combine the sparse TF-IDF matrices with our dense custom features
    # This creates a powerful, hybrid feature matrix for the model to learn from
    X = sp.hstack((resume_vectors, jd_vectors, custom_features), format='csr')
    y = df['match_score']
    
    print("Feature engineering complete.")
    print(f"Final hybrid feature matrix shape: {X.shape}")

    # --- 3. Split Data for Training and Testing ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Data split into {len(y_train)} training samples and {len(y_test)} testing samples.")

    # --- 4. Train the Final XGBoost Model ---
    print("\nTraining the final, advanced XGBoost Regressor model...")
    
    model = XGBRegressor(
        objective='reg:squarederror',
        n_estimators=1000,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    print("Model training complete.")

    # --- 5. Evaluate the Final Model ---
    print("\nEvaluating the final model on the test set...")
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred)) # Manual calculation for compatibility
    r2 = r2_score(y_test, y_pred)
    
    print("\n--- Final Model Evaluation Metrics ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f}")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f}")
    print(f"R-squared (R²): {r2:.2f}")
    print("------------------------------------")
    print("This new model should provide much more context-aware and accurate scores.")

    # --- 6. Save the Final Model and Vectorizers ---
    print("\nSaving the final trained model and vectorizers...")
    
    joblib.dump(model, 'ats_model.joblib')
    joblib.dump(tfidf_resume, 'tfidf_resume.joblib')
    joblib.dump(tfidf_jd, 'tfidf_jd.joblib')
    
    print("Successfully saved 'ats_model.joblib', 'tfidf_resume.joblib', and 'tfidf_jd.joblib'.")
    print("\nYour custom model is now complete and ready for integration into the live backend API.")

if __name__ == "__main__":
    main()

