import json

from langchain_groq import ChatGroq

from state import EmailState


llm = ChatGroq(
    model="llama-3.3-70b-versatile"
)


def analyze_email(state: EmailState):

    email = state["cleaned_email"]

    prompt = f"""
You are an AI email assistant.

Analyze this email.

IMPORTANT:
Return ONLY valid JSON.
Do not explain anything.
Do not use markdown.
Do not generate code.

Return EXACTLY in this format:

{{
  "classification": "work",
  "urgency": "high",
  "entities": {{
    "people": [],
    "dates": [],
    "company": ""
  }},
  "action_items": [],
  "summary": "",
  "suggested_reply": ""
}}

classification must be ONLY:
spam
work
personal
finance
social
promotional

urgency must be ONLY:
low
medium
high
critical

EMAIL:
{email}
"""

    try:

        response = llm.invoke(prompt)

        content = response.content.strip()

        print("RAW LLM RESPONSE:")
        print(content)

        # Remove markdown if exists
        content = content.replace(
            "```json",
            ""
        ).replace(
            "```",
            ""
        ).strip()

        parsed = json.loads(content)

    except Exception as e:

        print("JSON PARSE ERROR:")
        print(e)

        parsed = {

            "classification":
                "work",

            "urgency":
                "low",

            "entities": {
                "people": [],
                "dates": [],
                "company": ""
            },

            "action_items": [],

            "summary":
                "Unable to summarize email.",

            "suggested_reply":
                "Thank you for your email."
        }

    classification = parsed.get(
        "classification",
        "work"
    ).lower().strip()

    urgency = parsed.get(
        "urgency",
        "low"
    ).lower().strip()

    allowed_classifications = [
        "spam",
        "work",
        "personal",
        "finance",
        "social",
        "promotional"
    ]

    allowed_urgencies = [
        "low",
        "medium",
        "high",
        "critical"
    ]

    if classification not in allowed_classifications:
        classification = "work"

    if urgency not in allowed_urgencies:
        urgency = "low"

    return {

        **state,

        "classification":
            classification,

        "urgency":
            urgency,

        "entities":
            parsed.get(
                "entities",
                {}
            ),

        "action_items":
            parsed.get(
                "action_items",
                []
            ),

        "summary":
            parsed.get(
                "summary",
                ""
            ),

        "suggested_reply":
            parsed.get(
                "suggested_reply",
                ""
            )
    }