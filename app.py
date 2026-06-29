import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from nlp_engine import FAQEngine

app = Flask(__name__, static_folder="static")
CORS(app)  # Enable Cross-Origin Resource Sharing

# Initialize FAQ Engine
# Ensure we load the faqs.json file from the directory app.py is in
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
faqs_path = os.path.join(BASE_DIR, "faqs.json")
faq_engine = FAQEngine(faqs_path)

# Route to serve the frontend single-page app
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# Route to serve static assets (CSS, JS, images)
@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

# API Endpoint to match a user query
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    user_message = data.get("message", "").strip()
    
    if not user_message:
        return jsonify({
            "matched": False,
            "score": 0.0,
            "answer": "Please ask a question so I can assist you.",
            "query_lemmas": [],
            "suggestions": []
        }), 400
        
    try:
        # Match using our NLP similarity engine
        match_result = faq_engine.match_question(user_message)
        return jsonify(match_result)
    except Exception as e:
        return jsonify({
            "matched": False,
            "score": 0.0,
            "answer": f"An error occurred while processing your request: {str(e)}",
            "query_lemmas": [],
            "suggestions": []
        }), 500

# API Endpoint to retrieve all FAQs (for search & catalog listing)
@app.route("/api/faqs", methods=["GET"])
def get_faqs():
    try:
        faqs = faq_engine.get_all_faqs()
        return jsonify(faqs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run locally on port 5000
    print("Starting FAQ Chatbot Flask server on http://localhost:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=True)
