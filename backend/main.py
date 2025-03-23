from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.text_processor import TextProcessor
import logging

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize text processor
text_processor = TextProcessor()

class TextInput(BaseModel):
    text: str
    window_size: int = 4

@app.post("/api/process-text")
async def process_text(input_data: TextInput):
    """
    Process input text and return tokens and their co-occurrences.
    """
    try:
        # Update window size if different from default
        if input_data.window_size != text_processor.window_size:
            text_processor.window_size = input_data.window_size
            
        result = text_processor.process(input_data.text)
        return result
    except Exception as e:
        logging.error(f"Error processing text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 