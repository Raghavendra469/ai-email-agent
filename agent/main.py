from fastapi import FastAPI

from pydantic import BaseModel

from graph import app


api = FastAPI()


class EmailRequest(BaseModel):

    email: str


@api.post("/analyze")

def analyze_email(request: EmailRequest):

    result = app.invoke({

        "email": request.email

    })

    return result

@api.get("/health")

def health():

    return {

        "status": "ok",

        "service": "ai-agent"

    }