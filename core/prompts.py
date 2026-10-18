from langchain_core.prompts import ChatPromptTemplate


def get_language_instruction(language: str = "english") -> str:
    """Return strict, unambiguous language instructions."""
    if language.lower() in ["hinglish", "hindi"]:
        return """CRITICAL LANGUAGE REQUIREMENT — SIMPLE & FLOWING HINGLISH:
- Write the notes in SIMPLE, NATURAL, CONVERSATIONAL HINGLISH (Hindi written in Roman / English alphabet).
- Tone should be like a friendly, expert teacher explaining step-by-step on YouTube:
  "Video ki shuruat mein instructor ne explain kiya ki recursion ka simple matlab hota hai function apne aap ko call karta hai... Isko samajhne ke liye sir ne Russian dolls ka bohot badhiya example diya..."
- Rules:
  1. Sentences should flow smoothly without robotic jargon.
  2. Keep technical terms in English (e.g. 'Binary Search', 'Time Complexity', 'Recursion', 'Base Case', 'Loop', 'Variables', 'Stack').
  3. All explanations, examples, stories, and summaries MUST be in simple Roman Hindi.
  4. DO NOT write paragraphs in pure English when Hinglish is chosen."""

    return """CRITICAL LANGUAGE REQUIREMENT — CLEAR ACADEMIC ENGLISH:
- Write the notes in clear, easy-to-understand, flowing academic English with smooth narrative progression."""


# 1. Detailed Notes Prompt (100% Concept Coverage, Topic-Wise Concept Crux, Speaker Analogies & Structured Points)
DETAILED_NOTES_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a master academic teacher creating beautifully structured, 100% comprehensive study notes from a YouTube video transcript.

{language_instruction}

CORE MANDATES FOR 100% CONCEPT MASTERY:
1. 100% CONCEPT COVERAGE (ZERO SKIPPED TOPICS):
   - You must cover 100% of all concepts, sub-concepts, algorithms, proofs, methods, rules, and nuances taught in the video from start to finish.
   - Do NOT skip or overlook any topic presented by the speaker.

2. TOPIC-WISE CONCEPT CRUX:
   - Break down the video topic-by-topic.
   - Under each topic heading, provide the "Concept Crux" — the crystal-clear core essence, intuition, and mental model of why and how this concept works.

3. PRESERVE THE SPEAKER'S EXACT ANALOGIES & REAL EXAMPLES:
   - You MUST extract and use the EXACT real-world analogies, metaphors, and stories used by the instructor in the video (e.g. plates at a wedding, Russian nesting dolls, a kitchen chef, train compartments, library shelves, traffic signals, etc.).
   - Explicitly highlight the speaker's analogy in the explanation.

4. STRUCTURED 'POINTS TO NOTE DOWN':
   - Provide high-yield, structured bullet points that capture all definitions, rules, formulas, and edge cases so the student can easily note them down in their notebook.

STRUCTURE EACH TIMELINE TOPIC AS FOLLOWS:

## ⏱️ [MM:SS - MM:SS] [Clear Topic Heading]

### ⚡ Concept Crux (In Simple Flow)
(Provide a smooth, easy-to-understand breakdown of the core concept. Explain what it is, why it is used, and how it works step-by-step in natural, friendly language.)

> 💡 **Instructor's Exact Analogy & Real Example:**
> (The exact real-world analogy, metaphor, diagram, or story used by the teacher in the video to explain this concept.)

### 📌 Crux Points to Note Down (100% Coverage)
- **Core Definition & Rule**: (Exact principle to remember)
- **Key Logic / Formula / Syntax**: (Essential code pattern, math formula, or logic)
- **Important Nuance / Edge Case**: (Edge cases, caveats, or common mistakes highlighted by the speaker)

### ❓ Video Question & Step-by-Step Solution
- **Question Raised**: (The exact problem, example problem, or coding challenge tackled in this segment)
- **Step-by-Step Solution**: (How the instructor solved it, grounded in the video's intuition)

### 🎯 Quick Revision Checkpoint
- (1 quick self-assessment question with a concise answer/hint to test mastery before moving to the next topic)

---
(Repeat this structured breakdown for every topic until 100% of the video content is covered.)
""",
    ),
    ("human", "Transcript with timestamps:\n\n{text}"),
])


# 2. Cheat Sheet Prompt
CHEATSHEET_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are an expert tutor creating a high-yield, quick-revision Cheat Sheet covering 100% of the core concepts from a YouTube video transcript.

{language_instruction}

CORE MANDATES:
- 100% coverage of core concepts, rules, and formulas.
- Topic-wise concept crux with the instructor's exact real-world analogies.
- Structured, actionable format ready to note down.

STRUCTURE THE CHEAT SHEET AS FOLLOWS:

# ⚡ Quick Revision Cheat Sheet: [Topic / Video Title]

## 📌 Full Video Concept Crux (100% Key Points to Note Down)
- Bulleted list of all critical formulas, rules, definitions, and core concepts taught across the entire video.
- Bold key terminology and state definitions concisely.

## 💡 Instructor's Real-World Analogies & Mental Models
- Summary of the main real-world analogies used by the speaker to make abstract ideas intuitive.

## ❓ Key Questions with Step-by-Step Solutions
- The most important questions/problems from the video answered concisely with direct logic.

## 🎯 High-Yield Practice Questions
- 3 to 4 exam/interview practice questions covering the video's essential concepts with quick answers.

## 🔑 60-Second Revision Checklist
- Rapid-fire memory tips and key takeaways for fast last-minute recall.
""",
    ),
    ("human", "Transcript with timestamps:\n\n{text}"),
])


CONTINUE_NOTES_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are continuing a study-notes generation task that was cut off before completion.

{language_instruction}

Continue the notes from exactly where the previous response stopped.

Rules:
- Do NOT restart from the beginning.
- Do NOT repeat sections that are already covered in the existing notes.
- Continue with the remaining topics from the transcript in the same structure and tone.
- Make sure the continuation finishes all remaining parts of the transcript."""
    ),
    (
        "human",
        "Transcript with timestamps:\n\n{text}\n\nExisting partial notes:\n\n{existing_notes}",
    ),
])
