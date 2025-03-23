import pytest
from text_processor import TextProcessor

@pytest.fixture
def text_processor():
    return TextProcessor()

def test_lemmatization():
    processor = TextProcessor()
    text = "running quickly through forests"
    processed = processor.lemmatize(text)
    assert "run" in processed
    assert "quick" in processed
    assert "forest" in processed

def test_stopword_removal():
    processor = TextProcessor()
    text = "this is a test sentence with stopwords"
    processed = processor.remove_stopwords(text)
    common_stopwords = {"this", "is", "a", "with"}
    for word in processed.split():
        assert word not in common_stopwords

def test_ngram_window():
    processor = TextProcessor()
    text = "the quick brown fox jumps"
    window_size = 2
    ngrams = processor.get_ngram_windows(text, window_size)
    assert ("quick", "brown") in ngrams
    assert ("brown", "fox") in ngrams
    assert ("fox", "jumps") in ngrams

def test_empty_text():
    processor = TextProcessor()
    assert processor.process("") == ""
    assert processor.lemmatize("") == ""
    assert processor.remove_stopwords("") == ""

def test_special_characters():
    processor = TextProcessor()
    text = "Hello! This is a test... With some special-characters."
    processed = processor.process(text)
    assert all(char.isalnum() or char.isspace() for char in processed)

def test_preprocess_text(text_processor):
    text = "The quick brown fox jumps over the lazy dog!"
    tokens = text_processor.preprocess_text(text)
    
    # Check if stopwords are removed
    assert "the" not in tokens
    # Check if lemmatization works
    assert "jump" in tokens
    # Check if punctuation is removed
    assert "!" not in tokens
    # Check if case is normalized
    assert all(t.islower() for t in tokens)

def test_extract_ngrams(text_processor):
    tokens = ["quick", "brown", "fox", "jump", "lazy", "dog"]
    cooccurrences = text_processor.extract_ngrams(tokens)
    
    # Check if co-occurrences are captured within window
    assert ("brown", "fox") in cooccurrences
    assert ("quick", "fox") in cooccurrences
    # Check if distant words are not connected
    assert ("quick", "dog") not in cooccurrences

def test_process_complete(text_processor):
    text = "The quick brown fox jumps over the lazy dog!"
    result = text_processor.process(text)
    
    assert "tokens" in result
    assert "cooccurrences" in result
    assert len(result["tokens"]) > 0
    assert len(result["cooccurrences"]) > 0

def test_single_word(text_processor):
    text = "hello"
    result = text_processor.process(text)
    
    assert len(result["tokens"]) == 1
    assert len(result["cooccurrences"]) == 0 