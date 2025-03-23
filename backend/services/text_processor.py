import spacy
import nltk
from typing import List, Dict, Set
from collections import defaultdict
import logging

# Download required NLTK data
nltk.download('stopwords')
nltk.download('punkt')

class TextProcessor:
    def __init__(self, window_size: int = 4):
        """
        Initialize the text processor with configurable window size for n-gram analysis.
        
        Args:
            window_size (int): Size of the sliding window for co-occurrence analysis
        """
        self.nlp = spacy.load('en_core_web_sm')
        self.window_size = window_size
        self.stopwords = set(nltk.corpus.stopwords.words('english'))
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text by lemmatizing and removing stopwords.
        
        Args:
            text (str): Input text to process
            
        Returns:
            List[str]: List of processed tokens
        """
        try:
            doc = self.nlp(text.lower())
            tokens = []
            
            for token in doc:
                if (not token.is_stop and 
                    not token.is_punct and 
                    not token.is_space and
                    len(token.text.strip()) > 1):
                    tokens.append(token.lemma_)
            
            return tokens
        except Exception as e:
            self.logger.error(f"Error in text preprocessing: {str(e)}")
            raise

    def extract_ngrams(self, tokens: List[str]) -> Dict[tuple, int]:
        """
        Extract n-grams using sliding window approach.
        
        Args:
            tokens (List[str]): List of preprocessed tokens
            
        Returns:
            Dict[tuple, int]: Dictionary of token pairs and their co-occurrence count
        """
        try:
            cooccurrences = defaultdict(int)
            
            for i in range(len(tokens)):
                window = tokens[max(0, i - self.window_size):min(len(tokens), i + self.window_size + 1)]
                
                for j in range(len(window)):
                    for k in range(j + 1, len(window)):
                        if window[j] != window[k]:
                            # Sort tokens to ensure consistent ordering
                            pair = tuple(sorted([window[j], window[k]]))
                            cooccurrences[pair] += 1
            
            return dict(cooccurrences)
        except Exception as e:
            self.logger.error(f"Error in n-gram extraction: {str(e)}")
            raise

    def process(self, text: str) -> Dict:
        """
        Process text and return both tokens and their co-occurrences.
        
        Args:
            text (str): Input text to analyze
            
        Returns:
            Dict: Dictionary containing processed tokens and their co-occurrences
        """
        try:
            tokens = self.preprocess_text(text)
            cooccurrences = self.extract_ngrams(tokens)
            
            return {
                'tokens': tokens,
                'cooccurrences': cooccurrences
            }
        except Exception as e:
            self.logger.error(f"Error in text processing: {str(e)}")
            raise 