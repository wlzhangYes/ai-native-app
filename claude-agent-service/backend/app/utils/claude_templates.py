"""
Claude Code configuration templates
"""

# SpecKit command templates
SPECKIT_COMMANDS = {
    "speckit.analyze.md": """# Speckit Analyze

Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.

This command helps identify potential issues and inconsistencies in your project specifications.
""",
    "speckit.clarify.md": """# Speckit Clarify

Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.

This command helps refine and clarify ambiguous requirements.
""",
    "speckit.implement.md": """# Speckit Implement

Execute the implementation plan by processing and executing all tasks defined in tasks.md.

This command automates the implementation based on your task definitions.
""",
    "speckit.specify.md": """# Speckit Specify

Create or update the feature specification from a natural language feature description.

Provide a clear description of the feature you want to specify.
""",
    "speckit.checklist.md": """# Speckit Checklist

Generate a custom checklist for the current feature based on user requirements.

This command creates a comprehensive checklist for feature completion.
""",
    "speckit.constitution.md": """# Speckit Constitution

Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.

Define your project principles and guidelines.
""",
    "speckit.plan.md": """# Speckit Plan

Execute the implementation planning workflow using the plan template to generate design artifacts.

This command helps create a detailed implementation plan.
""",
    "speckit.tasks.md": """# Speckit Tasks

Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.

This command creates a structured task list for implementation.
"""
}


# Default Claude settings
DEFAULT_SETTINGS = {
    "anthropic_auth_token": "${ANTHROPIC_AUTH_TOKEN}",
    "model": "${ANTHROPIC_MODEL}",
    "small_fast_model": "${ANTHROPIC_SMALL_FAST_MODEL}",
    "permission_mode": "acceptEdits",
    "auto_approval": {
        "enabled": True,
        "max_turns": 10
    },
    "workspace": {
        "enabled": True,
        "auto_save": True
    }
}
