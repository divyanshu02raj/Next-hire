# Next-hire

## Backend Environment

Create a `backend/.env` file and set:

```
GOOGLE_API_KEY=your_gemini_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
# Optional, defaults to India (in)
ADZUNA_COUNTRY=in
```

`ADZUNA_APP_ID` and `ADZUNA_APP_KEY` power the new jobs tab by pulling live listings from Adzuna's job-search API.