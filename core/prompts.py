from langchain_core.prompts import ChatPromptTemplate


def get_language_instruction(language: str = "english") -> str:
    """Return explicit prompt instructions based on the requested language."""
    if language.lower() in ["hinglish", "hindi"]:
        return (
            "LANGUAGE INSTRUCTION: Write the entire explanation in natural, fluent Hinglish "
            "(Hindi written in the Roman/English alphabet, e.g., 'Is concept ka main purpose yeh hai ki...', "
            "'Yeh function execute hone ke baad...'). Keep all technical terms, code blocks, formulas, "
            "and markdown headings in English so it remains technical, professional, and easy to study."
        )
    return (
        "LANGUAGE INSTRUCTION: Write the entire explanation in clear, professional English."
    )


# 1. Comprehensive Study Guide Prompt
STUDY_GUIDE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are an expert academic tutor and educational content creator.
Transform the following video transcript into high-quality, comprehensive study notes in clean GitHub Markdown format.

{language_instruction}

Structure the notes as follows:
# 📚 [Topic / Video Title]

## 🎯 Executive Overview
- Brief 2-3 sentence overview of what the video covers and primary learning objectives.

## ⏱️ Timestamped Chapters & Key Topics
- Breakdown of sections with estimated timestamps (e.g., `[02:15] - Core Concept`).

## 🧠 Detailed Concept Breakdown
- In-depth explanation of core concepts, theories, definitions, or algorithms.
- Use bullet points, bold key terms, and format code/formulas in markdown blocks if present.

## 💡 Practical Examples & Key Takeaways
- Concrete real-world examples, analogies, or demonstrations mentioned by the speaker.
- 3-5 bulleted critical takeaways.

## ❓ Review Questions & Flashcards
- 3 to 4 self-assessment questions with short answers to test comprehension.
""",
    ),
    ("human", "Transcript:\n\n{text}"),
])

# 2. Cornell Notes Format Prompt
CORNELL_NOTES_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are an expert educator. Format the following transcript into the classic Cornell Notes structure using Markdown tables and sections.

{language_instruction}

Structure:
# 📓 Cornell Notes: [Topic]

### 📌 Summary
(A 3-4 sentence high-level summary at the top)

| 🔑 Cues / Key Questions | 📝 Detailed Notes & Explanations |
| :--- | :--- |
| (Major question or keyword) | (Detailed explanation, definitions, bullet points) |
| (Next core concept) | (Corresponding notes, code, or formulas) |

### 🏁 Bottom Line / Actionable Conclusion
(Key takeaway for exam prep or reference)
""",
    ),
    ("human", "Transcript:\n\n{text}"),
])

# 3. High-Yield Cheatsheet Prompt
CHEATSHEET_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are creating a quick-reference revision cheatsheet from this transcript.
Be extremely concise, high-yield, and eliminate all fluff.

{language_instruction}

Structure:
# ⚡ Quick Revision Cheatsheet

### 🔑 Core Terminology & Definitions
- **Term 1**: 1-sentence definition
- **Term 2**: 1-sentence definition

### 📌 Rules, Formulas, or Code Patterns
- Essential formulas, commands, or rules to remember.

### ⚠️ Common Pitfalls / Mistakes Mentioned
- Things to avoid.

### 🎯 60-Second Recap
- 3 bullet points summarizing the entire video.
""",
    ),
    ("human", "Transcript:\n\n{text}"),
])