from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from text_processor import TextProcessor
import uvicorn

app = FastAPI()
processor = TextProcessor()

class TextRequest(BaseModel):
    text: str
    max_terms: int = 10

class TermRequest(BaseModel):
    text: str
    term: str
    window_size: int = 5

@app.post("/process")
async def process_text(request: TextRequest):
    try:
        tokens = processor.preprocess_text(request.text)
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-terms")
async def extract_terms(request: TextRequest):
    try:
        terms = processor.extract_key_terms(request.text, request.max_terms)
        return {"terms": terms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/related-terms")
async def find_related(request: TermRequest):
    try:
        related = processor.find_related_terms(request.term, request.text, request.window_size)
        return {"related_terms": related}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/topic-tokens")
async def get_topic_tokens(request: TextRequest):
    try:
        tokens = processor.process_for_topic_modeling(request.text)
        return {"tokens": tokens}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000) 