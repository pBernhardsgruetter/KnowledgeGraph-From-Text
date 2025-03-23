import spacy
from typing import List, Dict
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

class TextProcessor:
    def __init__(self):
        # Load English language model with word vectors
        self.nlp = spacy.load('en_core_web_md')
        
        # Get default stop words from spaCy
        self.stop_words = self.nlp.Defaults.stop_words
        
        # Add domain-specific stop words
        self.technical_stop_words = {
            'example', 'using', 'use', 'used', 'can', 'will',
            'also', 'one', 'way', 'may', 'might', 'could',
            'would', 'should', 'must', 'see', 'need', 'needs',
            'needed', 'like', 'want', 'wants', 'wanted'
        }
        self.stop_words.update(self.technical_stop_words)

    def preprocess_text(self, text: str) -> List[str]:
        """
        Preprocess text using spaCy's advanced NLP features
        """
        doc = self.nlp(text)
        tokens = []
        for token in doc:
            if (token.text.lower() not in self.stop_words and
                not token.is_punct and
                not token.is_space and
                not (token.like_num and token.text.isdigit()) and
                len(token.text) > 1):
                
                if token.pos_ in {'VERB', 'NOUN', 'PROPN', 'ADJ'}:
                    tokens.append(token.lemma_)
                else:
                    tokens.append(token.text.lower())
        return tokens

    def extract_key_terms(self, text: str, max_terms: int = 10) -> List[Dict[str, float]]:
        """
        Extract key terms using TF-IDF and word vectors
        """
        doc = self.nlp(text)
        noun_phrases = [chunk.text.lower() for chunk in doc.noun_chunks]
        entities = [ent.text.lower() for ent in doc.ents]
        all_terms = noun_phrases + entities + [token.text.lower() for token in doc 
                                             if token.pos_ in {'NOUN', 'PROPN', 'VERB', 'ADJ'}]
        
        term_freq = Counter(all_terms)
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        
        term_scores = []
        for term, freq in term_freq.most_common(max_terms * 2):
            term_doc = self.nlp(term)
            if len(term_doc) > 0 and term_doc[0].has_vector:
                doc_vector = doc.vector / np.linalg.norm(doc.vector)
                term_vector = term_doc.vector / np.linalg.norm(term_doc.vector)
                vector_similarity = np.dot(doc_vector, term_vector)
                
                tfidf_score = 0
                if term in feature_names:
                    term_idx = list(feature_names).index(term)
                    tfidf_score = tfidf_matrix[0, term_idx]
                
                combined_score = (vector_similarity + tfidf_score) / 2
                term_scores.append({
                    'term': term,
                    'score': float(combined_score),
                    'frequency': freq
                })
        
        return sorted(term_scores, key=lambda x: x['score'], reverse=True)[:max_terms]

    def process_for_topic_modeling(self, text: str) -> List[str]:
        """
        Process text for topic modeling
        """
        doc = self.nlp(text)
        tokens = []
        for token in doc:
            if (token.pos_ in {'NOUN', 'PROPN', 'VERB', 'ADJ'} and
                not token.is_stop and
                len(token.text) > 1 and
                token.text.lower() not in self.technical_stop_words):
                tokens.append(token.lemma_)
        return tokens 