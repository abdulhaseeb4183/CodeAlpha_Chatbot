import os
import json
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load SpaCy pipeline
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback just in case, though it is pre-installed
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

class FAQEngine:
    def __init__(self, faqs_path="faqs.json"):
        self.faqs_path = faqs_path
        self.faqs = []
        self.vectorizer = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b') # Support single letter words if needed
        self.tfidf_matrix = None
        self.preprocessed_questions = []
        self.load_faqs()

    def load_faqs(self):
        """Loads and processes the FAQ database."""
        if not os.path.exists(self.faqs_path):
            raise FileNotFoundError(f"FAQ file not found at {self.faqs_path}")
        
        with open(self.faqs_path, "r", encoding="utf-8") as f:
            self.faqs = json.load(f)
        
        # Preprocess each FAQ question
        self.preprocessed_questions = [
            self.preprocess(faq["question"]) for faq in self.faqs
        ]
        
        # Fit vectorizer and compute matrix
        if self.preprocessed_questions:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.preprocessed_questions)

    def preprocess(self, text):
        """Tokenizes, removes stopwords/punctuation, and lemmatizes the text using SpaCy."""
        if not text:
            return ""
        doc = nlp(text.lower().strip())
        tokens = []
        for token in doc:
            # Keep alphanumeric tokens, ignore standard punctuation & stopwords
            if not token.is_punct and not token.is_space and not token.is_stop:
                # Use lemma if valid, otherwise lowercase text
                tokens.append(token.lemma_)
        return " ".join(tokens)

    def get_all_faqs(self):
        """Returns the raw FAQ entries."""
        return self.faqs

    def match_question(self, user_query, threshold=0.20):
        """
        Matches user query with the best FAQ.
        Returns:
            dict containing match status, best answer, matched question, similarity score,
            preprocessed tokens/lemmas, and secondary suggestions.
        """
        # First, check for common greetings
        greetings = ["hello", "hi", "hey", "greetings", "sup", "yo"]
        words = user_query.lower().strip().split()
        cleaned_words = [w.strip("?.!,;:") for w in words]
        if any(w in greetings for w in cleaned_words):
            return {
                "matched": True,
                "score": 1.0,
                "id": "greeting",
                "category": "General",
                "question": "Greeting",
                "answer": "Hello! I am the AI Chatbot. Ask me anything about this chatbot, its NLP engine, setup instructions, or analytics dashboard!",
                "query_lemmas": ["greeting"],
                "suggestions": [
                    "What is AI Chatbot and how does it work?",
                    "How does the NLP Similarity Engine match user questions?",
                    "How do I run and test the AI Chatbot locally?"
                ]
            }

        # Preprocess query
        clean_query = self.preprocess(user_query)
        query_lemmas = clean_query.split()
        
        # Handle empty query after preprocessing (e.g., symbols only)
        if not clean_query:
            return {
                "matched": False,
                "score": 0.0,
                "answer": "I couldn't process any searchable keywords. Could you please rephrase your question using different words?",
                "query_lemmas": [],
                "suggestions": [faq["question"] for faq in self.faqs[:3]]
            }

        # Vectorize user query
        query_vector = self.vectorizer.transform([clean_query])

        # Compute cosine similarities
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # Find best match
        best_match_idx = similarities.argmax()
        best_score = similarities[best_match_idx]

        # Get all scores with corresponding FAQ items
        ranked_matches = []
        for idx, score in enumerate(similarities):
            ranked_matches.append({
                "faq": self.faqs[idx],
                "score": float(score)
            })
        
        # Sort matches by score descending
        ranked_matches = sorted(ranked_matches, key=lambda x: x["score"], reverse=True)

        # Collect secondary suggestions (exclude best match, require score > 0.05)
        suggestions = []
        for match in ranked_matches[1:]:
            if len(suggestions) < 3 and match["score"] > 0.05:
                suggestions.append(match["faq"]["question"])
        
        # If we don't have enough suggestions, fill with top FAQs
        while len(suggestions) < 3:
            for faq in self.faqs:
                q = faq["question"]
                if q not in suggestions and (len(ranked_matches) == 0 or q != ranked_matches[0]["faq"]["question"]):
                    suggestions.append(q)
                    if len(suggestions) == 3:
                        break

        # Check if score exceeds threshold
        if best_score >= threshold:
            best_faq = self.faqs[best_match_idx]
            return {
                "matched": True,
                "score": float(best_score),
                "id": best_faq["id"],
                "category": best_faq["category"],
                "question": best_faq["question"],
                "answer": best_faq["answer"],
                "query_lemmas": query_lemmas,
                "suggestions": suggestions,
                "all_scores": [{"question": m["faq"]["question"], "score": m["score"]} for m in ranked_matches[:5]]
            }
        else:
            # Fallback when match is below threshold
            return {
                "matched": False,
                "score": float(best_score),
                "answer": "I'm not completely sure about that. Here are some related questions that might help you:",
                "query_lemmas": query_lemmas,
                "suggestions": suggestions[:3],
                "all_scores": [{"question": m["faq"]["question"], "score": m["score"]} for m in ranked_matches[:5]]
            }

# Simple debug routine if run directly
if __name__ == "__main__":
    engine = FAQEngine()
    print("Preprocessed FAQ count:", len(engine.preprocessed_questions))
    
    test_queries = [
        "What is AI Chatbot?",
        "How do I run tests?",
        "tell me about the NLP engine",
        "hello",
        "unknown gibberish query here"
    ]
    
    for q in test_queries:
        res = engine.match_question(q)
        print(f"\nQuery: '{q}'")
        print(f"Matched: {res['matched']} (Score: {res['score']:.4f})")
        print(f"Lemmas: {res['query_lemmas']}")
        print(f"Answer: {res['answer'][:100]}...")
        if "all_scores" in res:
            print("Top scores:")
            for sc in res["all_scores"][:2]:
                print(f" - {sc['score']:.4f}: {sc['question']}")
