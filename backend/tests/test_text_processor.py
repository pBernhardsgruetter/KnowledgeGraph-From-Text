import pytest
from services.text_processor import TextProcessor

@pytest.fixture
def processor():
    return TextProcessor(window_size=3)

def test_preprocess_text(processor):
    text = "The quick brown fox jumps over the lazy dog!"
    tokens = processor.preprocess_text(text)
    
    # Check if stopwords are removed
    assert "the" not in tokens
    # Check if lemmatization works
    assert "jump" in tokens
    # Check if punctuation is removed
    assert "!" not in tokens
    # Check if case is normalized
    assert all(t.islower() for t in tokens)

def test_extract_ngrams(processor):
    tokens = ["quick", "brown", "fox", "jump", "lazy", "dog"]
    cooccurrences = processor.extract_ngrams(tokens)
    
    # Check if co-occurrences are captured within window
    assert ("brown", "fox") in cooccurrences
    assert ("quick", "fox") in cooccurrences
    # Check if distant words are not connected
    assert ("quick", "dog") not in cooccurrences

def test_process_complete(processor):
    text = "The quick brown fox jumps over the lazy dog!"
    result = processor.process(text)
    
    assert "tokens" in result
    assert "cooccurrences" in result
    assert len(result["tokens"]) > 0
    assert len(result["cooccurrences"]) > 0

def test_empty_text(processor):
    text = ""
    result = processor.process(text)
    
    assert len(result["tokens"]) == 0
    assert len(result["cooccurrences"]) == 0

def test_single_word(processor):
    text = "hello"
    result = processor.process(text)
    
    assert len(result["tokens"]) == 1
    assert len(result["cooccurrences"]) == 0 