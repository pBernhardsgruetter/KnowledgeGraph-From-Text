import spacy
from typing import List, Dict, Set
import json
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
        Preprocess text using spaCy's advanced NLP features:
        - Tokenization
        - Lemmatization
        - Stop word removal
        - Named Entity Recognition
        - Part-of-speech filtering
        """
        doc = self.nlp(text)
        
        # Extract meaningful tokens
        tokens = []
        for token in doc:
            # Skip if token is:
            # - stop word
            # - punctuation
            # - whitespace
            # - number (unless part of a meaningful term)
            # - single character
            if (token.text.lower() not in self.stop_words and
                not token.is_punct and
                not token.is_space and
                not (token.like_num and token.text.isdigit()) and
                len(token.text) > 1):
                
                # Use lemmatization for verbs and nouns
                if token.pos_ in {'VERB', 'NOUN', 'PROPN', 'ADJ'}:
                    tokens.append(token.lemma_)
                else:
                    tokens.append(token.text.lower())
        
        return tokens

    def extract_key_terms(self, text: str, max_terms: int = 10) -> List[Dict[str, float]]:
        """
        Extract key terms using TF-IDF and spaCy's word vectors
        """
        doc = self.nlp(text)
        
        # Get noun phrases and named entities
        noun_phrases = [chunk.text.lower() for chunk in doc.noun_chunks]
        entities = [ent.text.lower() for ent in doc.ents]
        
        # Combine with single tokens
        all_terms = noun_phrases + entities + [token.text.lower() for token in doc 
                                             if token.pos_ in {'NOUN', 'PROPN', 'VERB', 'ADJ'}]
        
        # Calculate term frequencies
        term_freq = Counter(all_terms)
        
        # Calculate importance scores using TF-IDF and word vectors
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        
        # Combine TF-IDF scores with word vector similarities
        term_scores = []
        for term, freq in term_freq.most_common(max_terms * 2):
            term_doc = self.nlp(term)
            if len(term_doc) > 0 and term_doc[0].has_vector:
                # Get term's vector similarity with document
                doc_vector = doc.vector / np.linalg.norm(doc.vector)
                term_vector = term_doc.vector / np.linalg.norm(term_doc.vector)
                vector_similarity = np.dot(doc_vector, term_vector)
                
                # Get TF-IDF score if available
                tfidf_score = 0
                if term in feature_names:
                    term_idx = list(feature_names).index(term)
                    tfidf_score = tfidf_matrix[0, term_idx]
                
                # Combine scores
                combined_score = (vector_similarity + tfidf_score) / 2
                term_scores.append({
                    'term': term,
                    'score': float(combined_score),
                    'frequency': freq
                })
        
        # Sort by score and return top terms
        return sorted(term_scores, key=lambda x: x['score'], reverse=True)[:max_terms]

    def find_related_terms(self, term: str, text: str, window_size: int = 5) -> List[Dict[str, float]]:
        """
        Find terms related to a given term using word vectors and co-occurrence
        """
        doc = self.nlp(text)
        term_doc = self.nlp(term)
        
        related_terms = {}
        
        # Find terms using word vectors
        if len(term_doc) > 0 and term_doc[0].has_vector:
            term_vector = term_doc[0].vector
            
            for token in doc:
                if (token.has_vector and 
                    token.text.lower() != term.lower() and
                    token.text.lower() not in self.stop_words):
                    similarity = token.vector.dot(term_vector) / (np.linalg.norm(token.vector) * np.linalg.norm(term_vector))
                    related_terms[token.text] = float(similarity)
        
        # Add co-occurrence information
        tokens = [token.text.lower() for token in doc]
        term_indices = [i for i, t in enumerate(tokens) if t == term.lower()]
        
        for idx in term_indices:
            start = max(0, idx - window_size)
            end = min(len(tokens), idx + window_size + 1)
            
            for i in range(start, end):
                if i != idx:
                    coterm = tokens[i]
                    if coterm not in self.stop_words:
                        related_terms[coterm] = related_terms.get(coterm, 0) + (1 / (abs(i - idx)))
        
        # Convert to list of dicts and sort by score
        result = [{'term': t, 'score': s} for t, s in related_terms.items()]
        return sorted(result, key=lambda x: x['score'], reverse=True)

    def process_for_topic_modeling(self, text: str) -> List[str]:
        """
        Process text specifically for topic modeling:
        - Remove stop words
        - Lemmatize
        - Keep only content words (nouns, verbs, adjectives)
        - Remove domain-specific stop words
        """
        doc = self.nlp(text)
        
        # Extract meaningful tokens for topic modeling
        tokens = []
        for token in doc:
            if (token.pos_ in {'NOUN', 'PROPN', 'VERB', 'ADJ'} and
                not token.is_stop and
                len(token.text) > 1 and
                token.text.lower() not in self.technical_stop_words):
                tokens.append(token.lemma_)
        
        return tokens 