from langchain_core.prompts import ChatPromptTemplate


def get_language_instruction(language: str = "english") -> str:
    """Return strict, unambiguous language instructions."""
    if language.lower() in ["hinglish", "hindi"]:
        return """CRITICAL LANGUAGE REQUIREMENT — STRICT HINGLISH:
- You MUST write the ENTIRE notes, explanations, questions, intuition, solutions, and summaries in natural, conversational HINGLISH (Hindi written in the Roman / Latin alphabet).
- Tone & Style Example:
  "Video mein instructor ne samjhaya ki recursion ka basic concept yeh hai ki jab ek function apne aap ko call karta hai jab tak base case hit na ho jaye. Isko visually samajhne ke liye sir ne Russian dolls ka example diya: har doll ke andar ek choti doll hoti hai aur aakhri sabse choti doll base case hoti hai..."
- Rules for Hinglish:
  1. ALL sentences, explanations, intuition, and summaries MUST be in Roman Hindi (Hinglish).
  2. Keep technical programming / academic terms in English (e.g., 'Binary Search Tree', 'Time Complexity', 'Recursion', 'Stack Overflow', 'Base Case', 'Pointers').
  3. Headings can be in English/Hinglish with emojis.
  4. DO NOT write paragraphs in pure English when Hinglish is chosen. Pure English output is strictly forbidden!"""

    return """CRITICAL LANGUAGE REQUIREMENT — PROFESSIONAL ENGLISH:
- Write the entire notes in crisp, clear, academic English."""


# 1. Detailed Notes Prompt (Timeline-Wise)
DETAILED_NOTES_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are an elite academic tutor creating high-yield, structured student study notes from a YouTube video transcript.

{language_instruction}

CRITICAL REQUIREMENT 1 — SPEAKER'S EXACT ANALOGIES & METAPHORS:
- You MUST identify, extract, and use the EXACT analogies, real-world stories, metaphors, and mental models used by the speaker in the video.
- DO NOT substitute the instructor's analogies with generic textbook definitions. If the speaker explains a concept using a real-world scenario (e.g., a restaurant kitchen, a book shelf, a traffic light, Russian dolls, a box, a postman), you MUST highlight and use that exact analogy in the Concepts, Solutions, and Intuition sections!

CRITICAL REQUIREMENT 2 — TIMELINE-WISE BREAKDOWN & CRISP LENGTH:
- Do NOT write a giant wall of text. Notes should be concise, structured, and easy to study.
- Organize the notes into chronological timeline blocks of roughly 3 to 7 minutes (e.g., `⏱️ 0:00 - 05:00`, `⏱️ 05:00 - 11:30`, etc., or matching the natural topic intervals in the transcript).
- If the transcript covers a specific user-defined range, focus solely on that range.

FOR EACH TIMELINE BLOCK, FOLLOW THIS EXACT STRUCTURE:

### ⏱️ Timeline: [Start MM:SS] - [End MM:SS] — [Topic / Segment Name]

- **💡 Concepts**:
  - Key concept(s) explained in this timeframe.
  - Core definitions and rules.

- **❓ Questions**:
  - What question, challenge, or problem was raised or addressed in this timestamp range?

- **📝 Solutions & Explanations**:
  - Step-by-step explanation of how the speaker solved or explained the concept.
  - MUST include the speaker's EXACT analogy/story from the video.

- **🧠 Intuition**:
  - The underlying mental model and intuition of WHY this works (grounded in the speaker's analogy).

- **📌 Summary**:
  - 2-3 lines quick summary of this segment.

- **🎯 Practice Questions**:
  - 1-2 targeted questions to test understanding of this section.

- **🔑 Revision Tips**:
  - 2 quick bullet points or memory hooks for fast recall.

---
(Repeat for each timeline block until the covered section is complete.)
""",
    ),
    ("human", "Transcript with timestamps:\n\n{text}"),
])


# 2. Cheat Sheet Prompt
CHEATSHEET_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are an expert tutor creating a high-yield Cheat Sheet from a YouTube video transcript.

{language_instruction}

CRITICAL REQUIREMENT — SPEAKER'S EXACT ANALOGIES:
- Incorporate the instructor's exact real-world analogies, metaphors, and examples into the explanations and solutions.

CRITICAL REQUIREMENT — HIGH YIELD & CONCISE:
- Provide maximum value with zero fluff. Every bullet point should be actionable and memorable.

STRUCTURE THE CHEAT SHEET EXACTLY AS FOLLOWS:

# ⚡ Quick Revision Cheat Sheet: [Topic / Video Title]

## 📌 Full Video Important Points
- Core concepts, definitions, formulas, and rules across the entire video.
- Include the instructor's main real-world analogies summarized in concise bullet points.

## ❓ Questions with Solutions
- The most important questions or problems addressed throughout the video.
- Crisp step-by-step solutions explained using the speaker's actual analogies.

## 🎯 Practice Questions
- 3 to 4 high-yield practice questions to test complete mastery, along with brief hints/answers.

## 🔑 Revision Tips & Key Formulas / Rules
- Rapid-fire memory checklist for quick last-minute review.
""",
    ),
    ("human", "Transcript with timestamps:\n\n{text}"),
])