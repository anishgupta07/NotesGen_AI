import json
import re
from core.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage


def check_video_educational(transcript_sample: str, title: str = "") -> tuple[bool, str]:
    """
    Guardrail to ensure only educational or academic videos generate notes.
    Returns: (is_educational: bool, message: str)
    """
    clean_sample = transcript_sample.strip()
    if len(clean_sample) < 30:
        return (
            False,
            "This is not an educational video. NotesGen only generates notes for educational, academic, tutorial, or instructional videos."
        )

    system_prompt = """You are an academic content classifier for a study notes generator app.
Your task is to determine whether the provided YouTube video transcript represents EDUCATIONAL, ACADEMIC, INSTRUCTIONAL, or TUTORIAL content.

Criteria for EDUCATIONAL content (is_educational = true):
- Academic subjects: Mathematics, Physics, Chemistry, Biology, History, Economics, Psychology, Philosophy, etc.
- Technical & Engineering: Programming, Computer Science, Data Structures, Algorithms, AI, Web Dev, System Design.
- Professional & Business: Finance, Accounting, Marketing strategies, Business case studies, Career tutorials.
- Exam Preparation: JEE, NEET, UPSC, GATE, SAT, GRE, Coding interviews, Certifications.
- How-To & Educational Guides: Educational documentaries, skill tutorials, instructional explainers.

Criteria for NON-EDUCATIONAL content (is_educational = false):
- Music videos, song lyrics, music tracks, dance videos.
- Comedy sketches, stand-up comedy, roasts, pranks, memes.
- Vlogs, daily lifestyle videos, room tours, hauls, travel vlogs without documentary value.
- Gaming live streams, casual gameplay, highlights (unless it's an educational game development/coding tutorial).
- Entertainment clips, movie trailers, movie reviews, celebrity gossip, drama, reality TV.

Output MUST be strictly valid JSON matching this schema:
{
  "is_educational": true or false,
  "reason": "1-sentence explanation"
}
"""

    # Extract first ~2500 characters
    excerpt = clean_sample[:2500]
    human_content = f"Video Title: {title or 'Unknown'}\n\nTranscript Excerpt:\n{excerpt}"

    try:
        llm = get_llm(temperature=0.0)
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_content)
        ])
        raw_text = response.content.strip()

        # Clean JSON markdown blocks
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text, flags=re.MULTILINE).strip()
        data = json.loads(cleaned)

        is_edu = bool(data.get("is_educational", False))
        if not is_edu:
            return (
                False,
                "This is not an educational video. NotesGen only generates notes for educational, academic, tutorial, or instructional videos."
            )
        return (True, "Educational content confirmed.")
    except Exception as e:
        print(f"Educational guardrail check encountered error ({e}). Allowing by default.")
        return (True, "Allowed by fallback.")
