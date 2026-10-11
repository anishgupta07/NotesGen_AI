import json
import re
from core.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage


def check_video_educational(transcript_sample: str, title: str = "", groq_api_key: str = None) -> tuple[bool, str]:
    """
    Guardrail to ensure only educational or academic videos generate notes.
    Uses lightweight token budgeting to avoid consuming primary model quota.
    Returns: (is_educational: bool, message: str)
    """
    clean_sample = transcript_sample.strip()
    if len(clean_sample) < 30:
        return (
            False,
            "This is not an educational video. NotesGen only generates notes for educational, academic, tutorial, or instructional videos."
        )

    system_prompt = """You are an academic content classifier for a study notes generator app.
Determine whether the provided YouTube video transcript represents EDUCATIONAL, ACADEMIC, INSTRUCTIONAL, or TUTORIAL content.

Criteria for EDUCATIONAL (is_educational = true):
- Academic subjects: Math, Science, Physics, Chemistry, Biology, History, Philosophy, Psychology, etc.
- Engineering/Tech: Programming, Coding tutorials, Data structures, AI, Web Dev, System Design.
- Business/Finance: Economics, Accounting, Marketing strategies, Business case studies.
- Exam Preparation: JEE, NEET, UPSC, GATE, SAT, GRE, Coding interviews.
- Instructional: How-To guides, skill tutorials, educational documentaries.

Criteria for NON-EDUCATIONAL (is_educational = false):
- Music videos, song lyrics, music tracks, dance videos.
- Comedy sketches, stand-up comedy, roasts, pranks, memes.
- Vlogs, daily lifestyle videos, room tours, hauls, travel vlogs without documentary value.
- Gaming streams, highlights (unless educational coding/development tutorial).
- Entertainment clips, movie trailers, celebrity gossip, drama, reality TV.

Output MUST be strictly valid JSON:
{
  "is_educational": true or false,
  "reason": "1-sentence explanation"
}
"""

    # Keep excerpt concise (~1200 chars) to minimize token footprint
    excerpt = clean_sample[:1200]
    human_content = f"Video Title: {title or 'Unknown'}\n\nTranscript Excerpt:\n{excerpt}"

    try:
        # Use Qwen or 20b model with max_tokens=150 to preserve 120b token quota
        llm = get_llm(temperature=0.0, model="qwen/qwen3.8-27b", max_tokens=150, api_key=groq_api_key)
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
