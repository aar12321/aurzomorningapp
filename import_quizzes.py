#!/usr/bin/env python3
"""
Import quiz data from CSV to Supabase database
"""
import csv
import os
import requests

# Supabase credentials
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "https://lnvebvrayuveygycpolc.supabase.co")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "REMOVED")

# Use REST API directly
REST_URL = f"{SUPABASE_URL}/rest/v1"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def import_quizzes(csv_file):
    """Import quiz data from CSV file"""
    
    # Read CSV file
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Importing {len(rows)} quiz questions...")
    
    current_quiz_id = None
    questions_for_quiz = []
    
    for idx, row in enumerate(rows, 1):
        topic_name = row['Topic'].strip()
        day = int(row['Day'])
        quiz_id_str = row['QuizID'].strip()
        
        # Get or create quiz
        if current_quiz_id != quiz_id_str:
            # Save previous quiz's questions
            if current_quiz_id and questions_for_quiz:
                save_quiz_questions(current_quiz_id, questions_for_quiz)
                questions_for_quiz = []
            
            current_quiz_id = quiz_id_str
            
            # Get topic ID using REST API
            topic_response = requests.get(
                f"{REST_URL}/topics?name=eq.{topic_name}",
                headers=headers
            ).json()
            
            if not topic_response or len(topic_response) == 0:
                print(f"ERROR: Topic '{topic_name}' not found in database!")
                continue
            
            topic_id = topic_response[0]['id']
            
            # Get or create quiz
            quiz_response = requests.get(
                f"{REST_URL}/quizzes?topic_id=eq.{topic_id}&day_number=eq.{day}",
                headers=headers
            ).json()
            
            if quiz_response and len(quiz_response) > 0:
                quiz_record_id = quiz_response[0]['id']
            else:
                # Create new quiz
                quiz_insert = requests.post(
                    f"{REST_URL}/quizzes",
                    headers=headers,
                    json={'topic_id': topic_id, 'day_number': day}
                ).json()
                quiz_record_id = quiz_insert[0]['id']
                print(f"Created quiz: {quiz_id_str} (Day {day}) for {topic_name}")
        
        # Collect question data
        questions_for_quiz.append({
            'quiz_id': quiz_record_id,
            'question_text': row['QuestionText'].strip(),
            'option_a': row['OptionA'].strip(),
            'option_b': row['OptionB'].strip(),
            'option_c': row['OptionC'].strip(),
            'option_d': row['OptionD'].strip(),
            'correct_answer': row['CorrectOption'].strip().upper(),
            'explanation': row['Explanation'].strip(),
            'order_number': int(row['QuestionNumber'])
        })
    
    # Save last quiz's questions
    if current_quiz_id and questions_for_quiz:
        save_quiz_questions(current_quiz_id, questions_for_quiz)
    
    print("Import complete!")

def save_quiz_questions(quiz_id, questions):
    """Save questions for a quiz using REST API"""
    print(f"Saving {len(questions)} questions for {quiz_id}...")
    
    # Insert questions
    result = requests.post(
        f"{REST_URL}/questions",
        headers=headers,
        json=questions
    ).json()
    print(f"Saved {len(result)} questions")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python import_quizzes.py <csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    if not os.path.exists(csv_file):
        print(f"Error: File '{csv_file}' not found!")
        sys.exit(1)
    
    import_quizzes(csv_file)

