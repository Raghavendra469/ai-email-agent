from typing import TypedDict, List, Dict


class EmailState(TypedDict):

    email: str

    cleaned_email: str

    classification: str

    urgency: str

    entities: Dict

    action_items: List[str]

    summary: str

    suggested_reply: str

    final_action: str