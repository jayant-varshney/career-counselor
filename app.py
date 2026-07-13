"""
AI-Powered Career Counseling Companion
Backend: Flask + IBM watsonx.ai (IBM Granite)
"""

import os
import json
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

# ─────────────────────────────────────────────
# AGENT INSTRUCTIONS
# Customize the AI counselor behaviour here.
# ─────────────────────────────────────────────
AGENT_INSTRUCTIONS = """
You are CareerAI, an expert career counseling companion powered by IBM Granite.
Your role is to provide personalized, actionable, and encouraging career guidance.

PERSONALITY:
- Professional yet approachable and motivating
- Data-driven but empathetic
- Always structured: use numbered lists, sections, and clear headings in responses

CORE CAPABILITIES:
1. Analyze student profiles (education, skills, interests) and suggest best-fit career paths
2. Recommend specific certifications with provider names (IBM, Google, AWS, Coursera, etc.)
3. Suggest technical skills to learn with a priority order (beginner → intermediate → advanced)
4. Propose hands-on project ideas relevant to the chosen career goal
5. Generate a step-by-step career roadmap with realistic timelines (months/years)
6. Provide resume improvement tips tailored to the target role
7. Give targeted interview preparation advice including common questions and answers

RESPONSE RULES:
- Always greet the user by name when their profile is provided
- Be specific: name tools, technologies, platforms, and companies
- Keep responses concise but complete (max ~350 words unless a roadmap is requested)
- Use markdown-style formatting: **bold** for key terms, numbered/bulleted lists
- When generating a roadmap, include phases: Foundation → Intermediate → Advanced → Job Ready
- Always end responses with one motivational sentence

TONE: Confident, clear, supportive. Never vague or generic.
"""

# ─────────────────────────────────────────────
# App & Config
# ─────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
CORS(app)

IBM_API_KEY    = os.getenv("IBM_API_KEY")
PROJECT_ID     = os.getenv("WATSONX_PROJECT_ID")
WATSONX_URL    = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

# IBM Granite model ID
GRANITE_MODEL_ID = "ibm/granite-4-h-small"

# ─────────────────────────────────────────────
# watsonx.ai client helper
# ─────────────────────────────────────────────
def get_model() -> ModelInference:
    credentials = Credentials(
        api_key=IBM_API_KEY,
        url=WATSONX_URL,
    )
    params = {
        GenParams.DECODING_METHOD: "greedy",
        GenParams.MAX_NEW_TOKENS: 1024,
        GenParams.MIN_NEW_TOKENS: 50,
        GenParams.REPETITION_PENALTY: 1.1,
        GenParams.STOP_SEQUENCES: ["<|endoftext|>", "Human:", "User:"],
    }
    return ModelInference(
        model_id=GRANITE_MODEL_ID,
        credentials=credentials,
        project_id=PROJECT_ID,
        params=params,
    )


def build_profile_context(profile: dict) -> str:
    """Convert profile dict to a readable context string."""
    if not profile:
        return ""
    return (
        f"Student Profile:\n"
        f"  Name: {profile.get('name', 'N/A')}\n"
        f"  Education: {profile.get('education', 'N/A')}\n"
        f"  Interests: {profile.get('interests', 'N/A')}\n"
        f"  Current Skills: {profile.get('skills', 'N/A')}\n"
        f"  Career Goal: {profile.get('careerGoal', 'N/A')}\n"
    )


def call_granite(system_prompt: str, user_message: str) -> str:
    """Call IBM Granite via watsonx.ai and return the response text."""
    model = get_model()
    full_prompt = (
        f"<|system|>\n{system_prompt}\n<|user|>\n{user_message}\n<|assistant|>\n"
    )
    response = model.generate_text(prompt=full_prompt)
    return response.strip() if isinstance(response, str) else str(response).strip()


# ─────────────────────────────────────────────
# Routes — Pages
# ─────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


# ─────────────────────────────────────────────
# Routes — API
# ─────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def chat():
    """General AI chat for career guidance."""
    data    = request.get_json(force=True)
    message = data.get("message", "").strip()
    profile = data.get("profile", {})

    if not message:
        return jsonify({"error": "Message is required"}), 400

    profile_ctx = build_profile_context(profile)
    system_prompt = AGENT_INSTRUCTIONS
    if profile_ctx:
        system_prompt += f"\n\nContext about the student you are advising:\n{profile_ctx}"

    try:
        reply = call_granite(system_prompt, message)
        return jsonify({"response": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/roadmap", methods=["POST"])
def roadmap():
    """Generate a personalized career roadmap."""
    data    = request.get_json(force=True)
    profile = data.get("profile", {})

    profile_ctx = build_profile_context(profile)
    prompt = (
        f"{profile_ctx}\n"
        "Generate a detailed, personalized Career Roadmap for this student. "
        "Structure it into 4 phases: Phase 1 – Foundation (0-3 months), "
        "Phase 2 – Intermediate (3-6 months), Phase 3 – Advanced (6-12 months), "
        "Phase 4 – Job Ready (12+ months). "
        "For each phase list: Key Skills to Learn, Certifications, Projects, and Milestones."
    )

    try:
        reply = call_granite(AGENT_INSTRUCTIONS, prompt)
        return jsonify({"roadmap": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/certifications", methods=["POST"])
def certifications():
    """Return recommended certifications."""
    data    = request.get_json(force=True)
    profile = data.get("profile", {})

    profile_ctx = build_profile_context(profile)
    prompt = (
        f"{profile_ctx}\n"
        "List the top 6 recommended certifications for this student's career goal. "
        "For each certification include: name, provider, difficulty level (Beginner/Intermediate/Advanced), "
        "and a one-sentence reason why it matters for their goal."
    )

    try:
        reply = call_granite(AGENT_INSTRUCTIONS, prompt)
        return jsonify({"certifications": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/skills", methods=["POST"])
def skills():
    """Return recommended technical skills."""
    data    = request.get_json(force=True)
    profile = data.get("profile", {})

    profile_ctx = build_profile_context(profile)
    prompt = (
        f"{profile_ctx}\n"
        "List the top 8 technical skills this student should learn for their career goal. "
        "Organize them into: Must-Have Skills, Nice-to-Have Skills, and Emerging Skills. "
        "For each skill include: name, why it's important, and a beginner resource."
    )

    try:
        reply = call_granite(AGENT_INSTRUCTIONS, prompt)
        return jsonify({"skills": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/projects", methods=["POST"])
def projects():
    """Suggest hands-on projects."""
    data    = request.get_json(force=True)
    profile = data.get("profile", {})

    profile_ctx = build_profile_context(profile)
    prompt = (
        f"{profile_ctx}\n"
        "Suggest 5 hands-on portfolio projects for this student based on their career goal and current skills. "
        "For each project include: project title, short description, tech stack, difficulty, "
        "and how it helps them stand out to recruiters."
    )

    try:
        reply = call_granite(AGENT_INSTRUCTIONS, prompt)
        return jsonify({"projects": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/resume", methods=["POST"])
def resume():
    """Provide resume improvement tips."""
    data    = request.get_json(force=True)
    profile = data.get("profile", {})

    profile_ctx = build_profile_context(profile)
    prompt = (
        f"{profile_ctx}\n"
        "Provide 7 specific resume improvement tips for this student targeting their career goal. "
        "Include: what to highlight, how to phrase experience, keywords to include (ATS optimization), "
        "sections to add, and common mistakes to avoid."
    )

    try:
        reply = call_granite(AGENT_INSTRUCTIONS, prompt)
        return jsonify({"resume": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/interview", methods=["POST"])
def interview():
    """Provide interview preparation suggestions."""
    data    = request.get_json(force=True)
    profile = data.get("profile", {})

    profile_ctx = build_profile_context(profile)
    prompt = (
        f"{profile_ctx}\n"
        "Provide a comprehensive interview preparation guide for this student targeting their career goal. "
        "Include: 5 likely technical questions with brief model answers, 3 behavioral questions with STAR-method tips, "
        "what to research before the interview, and how to present their project portfolio."
    )

    try:
        reply = call_granite(AGENT_INSTRUCTIONS, prompt)
        return jsonify({"interview": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/dashboard", methods=["POST"])
def dashboard():
    """Return a dashboard summary with career path recommendation."""
    data    = request.get_json(force=True)
    profile = data.get("profile", {})

    profile_ctx = build_profile_context(profile)
    prompt = (
        f"{profile_ctx}\n"
        "Create a Career Dashboard Summary for this student. Include:\n"
        "1. Top 3 Recommended Job Roles (with salary range and growth outlook)\n"
        "2. Overall Skill Match Score (out of 100) with brief explanation\n"
        "3. Immediate Next Steps (top 3 actions to take this week)\n"
        "4. Long-term Career Trajectory (where they could be in 5 years)\n"
        "5. Motivational insight specific to their profile."
    )

    try:
        reply = call_granite(AGENT_INSTRUCTIONS, prompt)
        return jsonify({"dashboard": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
