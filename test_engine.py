from nlp_engine import FAQEngine

def test_engine():
    engine = FAQEngine("faqs.json")
    print("=== FAQ ENGINE VERIFICATION ===")
    
    # Test cases: (query, expected_matched, expected_id_or_substring)
    test_cases = [
        ("What is AI Chatbot?", True, "what_is_chatbot"),
        ("how does the chatbot work?", True, "what_is_chatbot"),
        ("how does nlp similarity engine work?", True, "nlp_matching_engine"),
        ("how to run and test locally?", True, "run_locally"),
        ("how to run verification tests?", True, "run_tests"),
        ("tell me about the dashboard analytics?", True, "analytics_dashboard"),
        ("hello", True, "greeting"),
        ("what is the weather like in New York today?", False, None)
    ]
    
    success = True
    for query, expected_match, expected_id in test_cases:
        res = engine.match_question(query)
        match_ok = res["matched"] == expected_match
        id_ok = True
        if expected_match and expected_id:
            id_ok = res.get("id") == expected_id
            
        status = "PASS" if (match_ok and id_ok) else "FAIL"
        if status == "FAIL":
            success = False
            
        print(f"[{status}] Query: '{query}'")
        print(f"       Result Match: {res['matched']} (Score: {res['score']:.4f})")
        if res['matched']:
            print(f"       Matched ID: {res.get('id')} | Question: '{res.get('question')}'")
        else:
            print(f"       Fallback Answer: '{res.get('answer')}'")
        print("-" * 50)
        
    if success:
        print("ALL TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED. CHECK SCORING AND THRESHOLDS.")
        
if __name__ == "__main__":
    test_engine()
