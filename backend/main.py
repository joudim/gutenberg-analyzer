from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import openai  
import os
from pydantic import BaseModel

openai.api_key = os.environ.get("OPENAI_API_KEY")
openai.api_base = "https://api.groq.com/openai/v1"


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_middle_chunk(text: str, length: int = 5000) -> str:
    if len(text) <= length:
        return text
    start = (len(text) - length) // 2
    return text[start:start + length]

@app.get("/api/book")
def get_book(id: int):
    base_urls = [
        f"https://www.gutenberg.org/files/{id}/{id}-0.txt",
        f"https://www.gutenberg.org/files/{id}/{id}.txt",
        f"https://www.gutenberg.org/ebooks/{id}.txt.utf-8",
    ]

    for url in base_urls:
        response = requests.get(url)
        if response.status_code == 200 and not response.text.startswith("<!DOCTYPE html>"):
            return {"book_id": id, "content": response.text[:100000]}  # limit for safety

    raise HTTPException(status_code=404, detail="Book not found in known formats.")



class AnalysisRequest(BaseModel):
    text: str

@app.post("/api/analyze")
def analyze_text(req: AnalysisRequest):
    chunk = get_middle_chunk(req.text, length=5000)
    prompt = f"""
    Given the following book text, extract a list of characters and their interactions.
    Return a JSON object like this:
    {{
      "characters": [
        {{
          "name": "Character Name",
          "interacts_with": [
            {{ "name": "Another Character", "count": 3 }}
          ]
        }},
        ...
      ]
    }}

    TEXT:
    {chunk}
    """

    try:
        response = openai.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return {"result": response['choices'][0]['message']['content']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"❌ LLM ERROR:{str(e)}")

@app.post("/api/quotes")
def extract_quotes(req: AnalysisRequest):
    chunk = get_middle_chunk(req.text, length=5000)
    prompt = f"""
    From the following book text, extract 3 important quotes between characters and describe the sentiment of each.
    Return JSON in this format:

    [
      {{
        "quote": "...",
        "sentiment": "positive",
        "speaker": "Character A",
        "target": "Character B"
      }},
      ...
    ]

    TEXT:
    {chunk}
    """

    try:
        response = openai.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
        )
        return {"quotes": response.choices[0].message.content}
    except Exception as e:
       raise HTTPException(status_code=500, detail=f"❌ Quote sentiment error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)
