from nlp_engine import FAQEngine

def test_engine():
    engine = FAQEngine("faqs.json")
    print("=== FAQ ENGINE VERIFICATION ===")
    
    # Test cases: (query, expected_matched, expected_id_or_substring)
    test_cases = [
        ("What is Antigravity IDE?", True, "what_is_antigravity"),
        ("who made antigravity ide?", True, "what_is_antigravity"),
        ("how to customize AGENTS.md rules?", True, "write_custom_rules"),
        ("tell me about slash commands like goal", True, "slash_commands"),
        ("permission denied write file error", True, "resolve_permission_errors"),
        ("how to create custom skill with skill.md?", True, "create_custom_skills"),
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
