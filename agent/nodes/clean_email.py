from state import EmailState
import dotenv
dotenv.load_dotenv()

def clean_email(state: EmailState):

    email = state["email"]

    cleaned = email.strip()

    return {
        "cleaned_email": cleaned
    }