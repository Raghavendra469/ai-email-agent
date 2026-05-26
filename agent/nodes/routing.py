from state import EmailState


def routing_decision(state: EmailState):

    classification = state["classification"]

    urgency = state["urgency"]


    # Ignore Spam
    if classification == "spam":

        return {
            "final_action": "ignore"
        }


    # Urgent Emails
    if urgency in ["high", "critical"]:

        return {
            "final_action":
            "notify_and_ask_approval"
        }


    # Normal Emails
    return {
        "final_action": "dashboard_only"
    }