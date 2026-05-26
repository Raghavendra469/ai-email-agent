from langgraph.graph import (
    StateGraph,
    END
)

from state import EmailState

from nodes.clean_email import clean_email

from nodes.analyze_email import analyze_email

from nodes.routing import routing_decision


workflow = StateGraph(EmailState)


# Add Nodes
workflow.add_node(
    "clean_email",
    clean_email
)

workflow.add_node(
    "analyze_email",
    analyze_email
)

workflow.add_node(
    "routing",
    routing_decision
)


# Entry Point
workflow.set_entry_point(
    "clean_email"
)


# Flow
workflow.add_edge(
    "clean_email",
    "analyze_email"
)

workflow.add_edge(
    "analyze_email",
    "routing"
)

workflow.add_edge(
    "routing",
    END
)


# Compile
app = workflow.compile()