# CodeAlpha - FAQ Chatbot with NLP Analytics

A premium, interactive FAQ Chatbot application built using a **Python Flask backend** and a modern **glassmorphic dark-theme frontend**. 

The chatbot uses natural language processing (NLP) to parse user questions, tokenizing and lemmatizing text with **SpaCy**, and matching user intents with stored FAQs using **scikit-learn**'s TF-IDF vector space models and Cosine Similarity calculations.

---

## 🌟 Core Features

- 🤖 **NLP Intent Matching**: Matches user questions using TF-IDF representation and Cosine Similarity to find the best response in the database.
- ⚙️ **SpaCy Lemmatization**: Preprocesses query inputs (lowercasing, cleaning punctuation/stopwords, converting words to base lemmas) for enhanced search accuracy.
- 📊 **Real-time Analytics Dashboard**: The right sidebar displays the computed Cosine Similarity score, match status, processed lemmatized tags, and the top 5 ranking matches for every query.
- 🔍 **FAQ Directory & Live Search**: The left sidebar catalogs all FAQs grouped by category. Includes a live-filtering search input to instantly locate relevant questions.
- 💫 **Premium Aesthetics**: Features a modern dark-theme user interface built with glassmorphic cards (`backdrop-filter: blur`), glowing neon highlights, Outfit and JetBrains Mono typography, custom animations, and interactive suggestions/chips.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, Flask, Flask-CORS
- **NLP & ML**: SpaCy (`en_core_web_sm`), scikit-learn (TF-IDF vectorizer + Cosine Similarity), NumPy
- **Frontend**: HTML5 (Semantic elements), CSS3 (Custom variables, glassmorphism, micro-animations), Vanilla JavaScript (Typing simulations, DOM updates, API queries)
- **Icons & Fonts**: Google Fonts (Outfit & JetBrains Mono), FontAwesome 6

---

## 📂 Project Directory Structure

```
d:/code_task2/
├── app.py                  # Flask Application Server (serves API & UI static files)
├── faqs.json               # Structured FAQ database containing categories & tags
├── nlp_engine.py           # SpaCy preprocessing & TF-IDF similarity math matching engine
├── requirements.txt        # Backend dependencies
├── test_engine.py          # Automated NLP matching test suite
├── .gitignore              # Ignored files (pycache, virtual environments, etc.)
└── static/
    ├── index.html          # Chat interface structure & layouts
    ├── styles.css          # Dark glassmorphic styling system & responsive designs
    └── script.js           # Frontend client-side search, API queries, & typing simulator
```

---

## 🚀 Setup & Installation

### Prerequisites
Make sure you have Python 3.10+ installed.

### 1. Install Dependencies
Install all required libraries listed in `requirements.txt`:
```bash
pip install -r requirements.txt
```
*Note: Make sure the SpaCy model `en_core_web_sm` is downloaded. The engine will automatically attempt to download it if missing, or you can run:*
```bash
python -m spacy download en_core_web_sm
```

### 2. Verify NLP Matching
Run the automated test script to check matching accuracies across greetings, paraphrased questions, and invalid topics:
```bash
python test_engine.py
```

### 3. Launch Flask Server
Start the Flask web server:
```bash
python app.py
```

Open your browser and navigate to **`http://localhost:5000`** to interact with the chatbot!
