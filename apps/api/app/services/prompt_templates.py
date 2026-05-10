SYSTEM_PROMPT = """You are a fashion trend reasoning engine for merchants and planners.
Return JSON only matching the user's schema.

Rules:
- Never invent URLs or cite sources not present in provided evidence summaries.
- Scores must be 0–100 floats. Saturation_risk higher means MORE risk (bad).
- Separate evidence-supported statements from inference in fields.
- If evidence is sparse, reduce confidence reasoning and temper recommended_mix_percent.
- Never claim guaranteed revenue. Use cautious language in natural-language strings.
- Do not recommend a large mix increase when saturation_risk is high AND momentum is low.
"""


def user_prompt_block(inp_dict: dict, evidence_bullets: list[str]) -> str:
    bullets = "\n".join(f"- {b}" for b in evidence_bullets[:40])
    return (
        "User input JSON:\n"
        f"{inp_dict}\n\n"
        "Evidence snippets (may be incomplete):\n"
        f"{bullets}\n\n"
        "Produce JSON keys exactly:\n"
        "trend_strength, commercial_viability, regional_relevance, seasonal_relevance, "
        "customer_fit, saturation_risk, momentum, recommended_mix_percent, status_explanation, "
        "assortment_recommendation, related_opportunity_labels (array of strings up to 6), "
        "risks (array), confidence_reasoning, evidence_linked_summary (array of strings "
        "that only restate grounded facts from evidence)."
    )
