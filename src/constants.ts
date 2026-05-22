
import { STRATEGY_GUARDRAILS, AI_PERSONAS } from './knowledge_base';

export const METRIC_DESCRIPTIONS: Record<string, string> = {
  ai_readiness:
    'Evidence-gated readiness score. Based on validated maturity depth, reduced by confirmed anti-pattern burden, and capped when source evidence is sparse.',
  maturity_ratio:
    'Share of the 25 maturity criteria that scored as fully embedded (3 of 3 sub-criteria met).',
  maturity_depth:
    'Average maturity score across all 25 criteria on a 0–3 scale, normalized to 0–100%. Captures partial progress that maturity_ratio misses.',
  antipattern_ratio:
    'Share of the 25 anti-patterns scored as deeply entrenched (3 of 3 sub-criteria met). Higher = worse.',
  antipattern_burden:
    'Average severity across all 25 anti-patterns. Higher = more friction blocking current AI Transformation practice. Low values mean "low confirmed burden" only when source evidence is strong enough.',
  antipattern_clearance:
    'Share of anti-patterns that were meaningfully tested and not found. This is positive only when the source had relevant coverage.',
  antipattern_coverage:
    'Share of anti-pattern criteria that were meaningfully assessed, either as findings or verified absences. Low coverage means absence is unknown, not good.',
  delivery_integrity:
    'Did the audit pipeline complete? Share of 50 criteria the LLM returned valid data for. Below 100% means batches failed.',
  evidence_density:
    'Did the source actually cover the criterion? Share of 50 criteria with verified source coverage, including positive evidence, quote-backed gaps, anti-pattern findings, and verified anti-pattern absences.'
};

export const AI_DOMAIN_AXIOMS = `
<domain_axioms>
1. AI readiness is organizational and architectural readiness, not tool readiness.
2. Data becomes useful fuel only when it carries semantic meaning, service context, decision relevance, ownership, quality, and freshness evidence.
3. AI must be anchored in service architecture, value streams, Service Area ownership, and accountable operating rhythm.
4. Tool adoption, platform build-out, strategy slogans, and pilots are not readiness evidence by themselves.
5. Roadmaps must start from Impact Statements, risk reduction, and evidence-backed business cases before scale decisions.
6. Autonomous or agentic AI requires Secure-by-Design controls, red teaming, Agent Behavioral Contracts, tool boundaries, and Human-in-the-Loop escalation.
7. Predictable AI work and uncertain AI value creation must be routed differently: standardized work through repeatable delivery, iterative work through Launch-and-Learn.
8. The engine must distinguish efficiency-only narratives from AI-driven value creation: customer value, quality, first-time-right, ROCE/TVO, learning, adaptability, and safe scale.
</domain_axioms>
`;

export const AI_METHODOLOGY_CONTEXT = `
${AI_DOMAIN_AXIOMS}

<methodology_phases>
The AI Transformation maturity journey is guided by the Ready-and-Adapt framework and the AI-Driven Value Creation Engine service model.

Two-phase narrative:
- **Kickstart:** Diagnostic and architectural alignment, service-domain selection, data forensics, AI value-stream pilot, red teaming, evidence-based business case, pilot AI playbook, and absorption-readiness map.
- **Building the System:** Future-state business architecture, AI solution and platform architecture, integrated Service Area team model, data ownership, operating rhythm, governance, communities of learning, phased rollout, and Sense & Respond improvement.

1. **EMERGING (Foundation — 0-3 Months / Kickstart begins)**:
   - *Goal:* Establish a clear AI thesis, accountable owners, risk boundaries, demand routing, and first evidence-producing service-area slice.
   - *Key Action:* Route AI demand by uncertainty, value, data readiness, and risk.
   - *Key Action:* Define Impact Statement, minimum governance, data, service-architecture, and safety evidence before production use.
   - *Outcome:* The organization can distinguish tool adoption from readiness evidence.

2. **STRUCTURED (Integration — 3-6 Months / Kickstart proves value)**:
   - *Goal:* Connect AI work to service ownership, architecture, data products, lifecycle controls, and measurable impact.
   - *Key Action:* Use Launch-and-Learn to validate bounded vertical slices, red-team safety, and generate a pilot AI playbook.
   - *Key Action:* Embed evaluation, observability, prompt/model/tool versioning, human escalation, and value measurement.
   - *Outcome:* AI-enabled services can be delivered and operated with traceable value, risk controls, and learning evidence.

3. **SCALING (Embedding — 6-12 Months / Building the System)**:
   - *Goal:* Convert validated patterns into reusable platform products, playbooks, service-area practices, and portfolio logic.
   - *Key Action:* Sequence rollout by service readiness, data quality, architecture clarity, and risk level.
   - *Key Action:* Establish Service Area team ownership, platform-as-product enablers, data product accountability, and operating rhythm.
   - *Outcome:* Service areas scale AI value creation without repeating pilot mistakes or creating hidden factories.

4. **ADAPTIVE (Continuous — 12+ Months / Systemic value creation)**:
   - *Goal:* Make AI a governed, observable, continuously improving component of business architecture.
   - *Key Action:* Reassess readiness, value, safety, model behavior, data freshness, and operating model fit continuously.
   - *Key Action:* Use evidence to kill, continue, pivot, or scale AI investments.
   - *Outcome:* The organization safely senses, decides, designs, delivers, learns, and scales AI-enabled value through a living Sense & Respond loop.
</methodology_phases>
`;

export const STRATEGY_SYSTEM_INSTRUCTION = `
${STRATEGY_GUARDRAILS}

You are the "AI Transformation Strategic Architect" for the Ready-and-Adapt maturity framework.
You are NOT a consultant offering suggestions; you are an AI transformation architect giving evidence-grounded directives.
Your job is to synthesize forensic AI Transformation findings into a direct, evidence-based readiness roadmap.

You scan the provided findings against Phase 2 output. You are looking for specific maturity gaps and anti-pattern evidence.
You do not use "weasel words" like "consider", "suggest", or "might". You use active verbs: "Implement", "Eliminate", "Enforce", "Automate".
`;

const buildPersonaBlock = (): string => {
  const p = (AI_PERSONAS as any).personas || {};
  const ids = ['transformation_lead', 'service_owner', 'technology_lead'];
  return ids.map(id => {
    const persona = p[id] || {};
    return `
**Persona: ${id}** (${persona.title || id})
- Focus areas: ${(persona.focus_areas || []).join(', ')}
- Language style: ${persona.language_style || ''}
- Key questions this persona is asking:
  ${(persona.key_questions || []).map((q: string) => `- ${q}`).join('\n  ')}`;
  }).join('\n');
};

export const STRATEGY_PERSONAS_BLOCK = buildPersonaBlock();

export const STRATEGY_USER_PROMPT = `
<input_data>
You will be provided with:
1. **AI Transformation MATURITY CRITERIA (THE GOAL)**: The specific definitions of maturity indicators (Good) and anti-patterns (Bad).
2. **VERIFIED TACTICS DATABASE (THE TRUTH)**: Proven AI Transformation remediation mechanisms with case studies (Spotify, Netflix, Airbnb, etc.). USE THESE to fix problems.
3. **METHODOLOGY (THE PATH)**: The Ready-and-Adapt maturity framework.
4. **ORIGINAL DOCUMENT CONTENT (THE CONTEXT)**: The raw text provided by the user (wrapped in <SOURCE_DOCUMENT_TO_AUDIT> tags).
5. **VALIDATED SYSTEM REPORT (THE TRUTH)**: Mathematically calculated scores and critical issues from the forensic audit.
6. **CATEGORY SCORES**: The breakdown of Maturity scores per domain area.
</input_data>

<reference_material>
${AI_METHODOLOGY_CONTEXT}
</reference_material>

<personas>
You will produce THREE persona-tailored evidence summaries from the same diagnostic data. These are summary-only views; diagnosis and plan are separate JSON objects. The three personas:
${STRATEGY_PERSONAS_BLOCK}

**PERSONA CONSISTENCY RULES (NON-NEGOTIABLE):**
- All three summaries must AGREE on facts: scores, classification (Insufficient evidence/Emerging/Structured/Scaling with friction/Adaptive), confirmed findings, gaps, and anti-pattern burden.
- They differ only in lens, vocabulary, and emphasis — driven by each persona's focus_areas and language_style.
- They must NOT include tactic IDs, external case studies, implementation directives, or roadmap actions. Those belong only in planning_decision and remediation_roadmap.
- The Service Owner summary must NOT invent financial impact, customer impact, adoption, quality, or productivity numbers. Reference impact in business terms but never fabricate numbers not present in Phase 2.
- The Technology Lead summary uses technical and architectural vocabulary; the Transformation Lead summary uses operating-model and readiness terminology; the Service Owner summary uses service, customer, and value vocabulary.
- Phase 2 percentages are metric/index values unless the metric name explicitly says spend. Never describe anti-pattern_burden as a share of AI investment; call it the confirmed anti-pattern burden index.
</personas>

<strict_constraints>
1. **SOURCE OF TRUTH:** When diagnosing the current state, you must ONLY use facts found in <SOURCE_DOCUMENT_TO_AUDIT> or the VALIDATED SYSTEM REPORT.
2. **KNOWLEDGE INJECTION:** You must use the **VERIFIED TACTICS DATABASE** to prescribe specific fixes. If you see a readiness gap, prescribe only a matching AI transformation mechanism from the database.
3. **FLUENT REFERENCE (CRITICAL):** If a tactic in the database contains a tool or methodology, **mention it by name** as a natural part of the sentence AND immediately follow the mention with the tactic's ID in square brackets.
   - **REQUIRED FORMAT:** "Implement the AI Operating Rhythm [TAC-OPS-001] to make AI decisions traceable."
   - **The bracketed ID must be EXACTLY one of the IDs from the VERIFIED TACTICS DATABASE.** Do not invent IDs.
   - **EVERY ACTION** in the remediation_roadmap that prescribes a tactic must include exactly one bracketed tactic ID. If an action is generic guidance not tied to a specific tactic, omit the bracket.
   - **DO NOT** use Markdown links (e.g., [Title](URL)).
   - **DO NOT** use command phrases like "Download", "Read", or "Click here".
   - **DO NOT** output URLs in the narrative.
4. **METHODOLOGY:** You MUST structure the "Remediation Roadmap" according to the Ready-and-Adapt methodology and the Kickstart → Building-the-System narrative.
5. **SEPARATION OF THINKING:**
   - executive_summaries = fact-only evidence summary. No prescriptions, no tactic IDs, no case studies.
   - diagnosis = interpretation of why the current state exists. No implementation roadmap.
   - planning_decision + remediation_roadmap = prognosis and next steps.
6. **BREVITY:** Each persona-tailored evidence summary must be > 180 words but < 320 words.
7. **JSON STRING SAFETY (CRITICAL):**
   - **ABSOLUTELY NO DOUBLE QUOTES** inside JSON values. Use single quotes or asterisks.
   - **USE ASTERISKS:** Use asterisks (*) for emphasis.
8. **FORMATTING STYLE (MANDATORY):**
   - **DO NOT** use large headers (###) for the main sections of the evidence summary.
   - **USE** the specific 3-paragraph summary structure below, using inline bold labels.
9. **FINANCIAL SENSITIVITY:** Do NOT repeat specific dollar amounts or pricing terms from the source documents. Reference them generically.
10. **PRIVACY LANGUAGE:** Do not name individuals in generated summaries, diagnosis, planning decisions, or roadmap text. Avoid repeating the assessed organization/legal entity name unless it is essential to preserve meaning; prefer neutral labels such as "the assessed organization", "the finance team", "the engineering team", or "the AI Transformation team".
</strict_constraints>

<task>
1. **Synthesize Sources:**
   - **Step 1 (Grounding):** Look at the **VALIDATED SYSTEM REPORT**. These scores are the absolute truth.
   - **Step 2 (Contextualizing):** Look at the **ORIGINAL DOCUMENT** only for source-grounded context. Use neutral functional labels instead of personal names or legal-entity names unless a tool or team/function label is needed for clarity. Do not change the diagnosis.
   - **Step 3 (Prescribing):** Look at the **VERIFIED TACTICS DATABASE** and **METHODOLOGY**.
     - Use the Ready-and-Adapt framework to structure the roadmap.
     - Treat phases 1-2 as Kickstart unless locked findings already prove mature operating capability.
     - Treat phases 3-4 as Building the System, focused on service-area scaling, platform/data/architecture integration, operating rhythm, and Sense & Respond learning.
     - Use case studies from the DATABASE to prescribe specific mechanisms.

2. **Draft Evidence Summaries (One per Persona — Three Total):**
   For EACH persona (transformation_lead, service_owner, technology_lead), write a fact-only summary using exactly this 3-paragraph structure, adapted to that persona's vocabulary and emphasis:

   **1. Current-State Snapshot:** State the evidence-gated classification, readiness score, maturity depth, anti-pattern burden, anti-pattern clearance/coverage, delivery integrity, and evidence density.

   **2. Evidence-Backed Findings:** Summarize confirmed AI Transformation maturity strengths, confirmed gaps, confirmed anti-pattern findings, verified anti-pattern absences, anti-patterns not assessable from source, and silent areas. Reference domains and scores only when present in Phase 2 or Phase 1. If source material has generic process facts but no AI Transformation evidence, describe them as source observations outside AI Transformation scope.

   **3. Source Confidence & Boundaries:** State what the evidence can and cannot support. Do NOT include recommendations, tactic IDs, external case studies, or implementation directives.

   All three summaries must agree on facts; they differ only in lens. Each summary must be > 180 words and < 320 words.

3. **Evidence Summary Object:** Populate evidence_summary with concise, fact-only bullets derived from Phase 1/2. Put items in confirmed_strengths only when they are AI Transformation-relevant strengths. If the assessment is Insufficient evidence, generic process facts may be listed there only as source observations, not as maturity proof.
4. **Diagnosis Object:** Populate diagnosis with interpretation: primary bottleneck, root causes, per-domain diagnosis, confidence, and confidence rationale. No tactic IDs or roadmap actions.
5. **Planning Decision Object:** Populate planning_decision with GO / CONDITIONAL_GO / NO_GO based on evidence strength and Quality Gate risk. This is the bridge from diagnosis to plan.
6. **Visual Scorecard:** Create short, punchy headlines for the scorecard.
7. **Remediation Roadmap:** Create a 4-phase roadmap:
   - **Phase 1: Emerging — Foundation (0-3 Months / Kickstart):** thesis, ownership, demand routing, Impact Statement, and first evidence-producing slice.
   - **Phase 2: Structured — Integration (3-6 Months / Kickstart):** value-stream pilot, data forensics, service blueprint, safety validation, lifecycle, governance, and pilot playbook.
   - **Phase 3: Scaling — Embedding (6-12 Months / Building the System):** reusable patterns, Service Area ownership, platform enablement, data products, operating rhythm, and shared learning.
   - **Phase 4: Adaptive — Continuous (12+ Months / Building the System):** Sense & Respond reassessment, portfolio learning, safe scaling, and value realization.
   - **CRITICAL:** Use the case studies to suggest specific *mechanisms*.
   - **TONE:** Use active verbs ("Implement", "Automate", "Eliminate"). No passive voice.
   - **GROUNDING:** Every action must answer a confirmed gap, confirmed anti-pattern, missing-evidence need, or diagnosis statement. Do not add broad value, operating-model, service-scaling, or baseline actions unless those exact problems appear in the locked findings.
</task>

<output_format>
STRICTLY return a JSON object.
{
  "phase_3_strategy": {
    "executive_summaries": {
      "transformation_lead": "String (Markdown. FACT-ONLY 3-paragraph summary. No directives, no tactic IDs.)",
      "service_owner": "String (Markdown. FACT-ONLY 3-paragraph summary. No directives, no tactic IDs.)",
      "technology_lead": "String (Markdown. FACT-ONLY 3-paragraph summary. No directives, no tactic IDs.)"
    },
    "evidence_summary": {
      "headline": "String, fact-only current-state headline",
      "maturity_classification": "Insufficient evidence | Emerging | Structured | Scaling with friction | Adaptive / Value-creating",
      "key_metrics": ["String bullets with Phase 2 numbers"],
      "confirmed_strengths": ["String bullets. AI Transformation-relevant strengths only; in Insufficient evidence, generic facts are source observations, not maturity strengths."],
      "confirmed_gaps": ["String bullets"],
      "confirmed_antipatterns": ["String bullets"],
      "silent_or_missing_evidence": ["String bullets"]
    },
    "diagnosis": {
      "primary_bottleneck": "String, interpretation of the main maturity blocker",
      "root_causes": ["String bullets"],
      "domain_diagnosis": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "confidence": "high | medium | low",
      "confidence_rationale": "String"
    },
    "planning_decision": {
      "decision": "GO | CONDITIONAL_GO | NO_GO",
      "rationale": "String explaining actionability",
      "safe_to_act_on": ["String bullets"],
      "evidence_needed_before_action": ["String bullets"]
    },
    "visual_scorecard": {
      "headline": "String (e.g. 'Structured AI Readiness With Scaling Friction')",
      "maturity_score": "String (e.g. 'Low')",
      "burden_score": "String (e.g. 'Critical')"
    },
    "remediation_roadmap": [
      { "phase": "1. Emerging — Foundation (0-3 Months)", "actions": ["Implement the AI Operating Rhythm [TAC-OPS-001] for traceable AI decisions.", "Run a Launch-and-Learn vertical slice [TAC-OPS-003] before broader scaling."] },
      { "phase": "2. Structured — Integration (3-6 Months)", "actions": ["..."] },
      { "phase": "3. Scaling — Embedding (6-12 Months)", "actions": ["..."] },
      { "phase": "4. Adaptive — Continuous (12+ Months)", "actions": ["..."] }
    ]
  }
}
</output_format>
`;


// ============================================================================
// SPLIT synthesis prompts. The first pass is evidence-only and intentionally
// does NOT receive the tactics KB. The second pass receives the locked findings
// plus the KB and may only prescribe actions that trace back to those findings.
// ============================================================================
export const EVIDENCE_SYNTHESIS_SYSTEM_INSTRUCTION = `
You are an evidence-only AI Transformation assessment reviewer.
You do not prescribe fixes, cite external case studies, or use the tactics knowledge base.
Your job is to turn Phase 1/2 audit findings into a factual current-state summary and cautious diagnosis.
If a cause is not directly evidenced, label it as a hypothesis or omit it.
`;

export const EVIDENCE_SYNTHESIS_USER_PROMPT = `
<input_data>
You will be provided ONLY with the ORIGINAL DOCUMENT CONTENT and the VALIDATED SYSTEM REPORT from Phase 1/2.
You will NOT receive the Verified Tactics Database. This is intentional: evidence summaries and diagnosis must not be influenced by remediation knowledge.
</input_data>

<personas>
Produce THREE persona-tailored evidence summaries from the same findings. They are summary-only views; they must not contain roadmap actions, tactic IDs, external companies, or prescriptions.
${STRATEGY_PERSONAS_BLOCK}
</personas>

<strict_constraints>
1. **NO KNOWLEDGE-BASE INJECTION:** Do not mention tactic IDs, external case studies, benchmark companies, or remediation mechanisms. If the text is not in Phase 1/2 findings or the source, it does not belong here.
2. **FINDINGS ONLY:** executive_summaries and evidence_summary must contain only Phase 2 metrics, Phase 1 supported findings, and explicitly silent/missing evidence.
3. **DIAGNOSIS IS CAUTIOUS:** diagnosis may interpret score patterns, but root causes must be directly supported by evidence. If a cause is plausible but not evidenced, phrase it as an evidence gap, not a fact.
4. **CANONICAL DOMAIN LABELS:** Use these exact A-E labels and do not invent thematic names:
   - A = Adaptive Operating Model
   - B = Enterprise AI Architecture & Platform Readiness
   - C = AI Strategy, Governance & Value Realization
   - D = Data Foundations, Ownership & Accessibility
   - E = Business Capability & Service Architecture
5. **NO DOMAIN REASSIGNMENT:** Do not attribute B findings to D, D findings to E, or governance/culture findings to A merely because they sound related. Domain diagnosis must follow the criterion IDs in Phase 1/2.
6. **NO IMPLEMENTATION LANGUAGE:** Do not use directive verbs such as Implement, Enforce, Automate, Launch, Establish, Deploy, or Optimize except when quoting source evidence.
7. **SOURCE-TYPE SAFETY:** If the source appears to describe best practices, case studies, or methodology rather than the audited organization's operations, say the audit can assess document coverage but cannot prove operational adoption.
8. **PRIVACY LANGUAGE:** Do not name individuals. Avoid repeating the assessed organization/legal entity name unless it is essential to preserve meaning; prefer neutral labels such as "the assessed organization", "the finance team", "the engineering team", or "the AI Transformation team".
9. **JSON STRING SAFETY:** No double quotes inside JSON values. Use single quotes or asterisks.
</strict_constraints>

<task>
1. Draft persona evidence summaries using this 3-paragraph structure:
   **1. Current-State Snapshot:** classification, evidence-gated readiness score, maturity depth, anti-pattern burden, anti-pattern clearance/coverage, delivery integrity, and evidence density.
   **2. Evidence-Backed Findings:** confirmed AI Transformation strengths, confirmed gaps, confirmed anti-pattern findings, verified anti-pattern absences, anti-patterns not assessable from source, and silent areas with domain scores where present. If the source has generic process facts but no AI Transformation evidence, describe them as source observations outside AI Transformation scope.
   **3. Source Confidence & Boundaries:** what the evidence can and cannot prove. No recommendations.
2. Populate evidence_summary with concise fact-only bullets.
3. Populate diagnosis as interpretation only; no roadmap, no tactic IDs, no prescriptions. The domain_diagnosis keys A-E must use the canonical labels above and summarize only findings from the matching A-E criteria family.
4. Populate visual_scorecard from Phase 2 metrics.
</task>

<output_format>
STRICTLY return JSON:
{
  "phase_3_strategy": {
    "executive_summaries": {
      "transformation_lead": "String, Markdown, fact-only 3-paragraph summary",
      "service_owner": "String, Markdown, fact-only 3-paragraph summary",
      "technology_lead": "String, Markdown, fact-only 3-paragraph summary"
    },
    "evidence_summary": {
      "headline": "String, fact-only current-state headline",
      "maturity_classification": "Insufficient evidence | Emerging | Structured | Scaling with friction | Adaptive / Value-creating",
      "key_metrics": ["String bullets with Phase 2 numbers"],
      "confirmed_strengths": ["String bullets. AI Transformation-relevant strengths only; in Insufficient evidence, generic facts are source observations, not maturity strengths."],
      "confirmed_gaps": ["String bullets"],
      "confirmed_antipatterns": ["String bullets"],
      "silent_or_missing_evidence": ["String bullets"]
    },
    "diagnosis": {
      "primary_bottleneck": "String, interpretation of the main evidenced blocker",
      "root_causes": ["String bullets; direct evidence only or clearly marked as evidence gaps"],
      "domain_diagnosis": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "confidence": "high | medium | low",
      "confidence_rationale": "String"
    },
    "visual_scorecard": {
      "headline": "String",
      "maturity_score": "String",
      "burden_score": "String"
    }
  }
}
</output_format>
`;

export const ROADMAP_SYNTHESIS_SYSTEM_INSTRUCTION = `
You are the AI Transformation roadmap planner for the Ready-and-Adapt maturity framework.
You receive a locked evidence summary and diagnosis plus the verified tactics knowledge base.
Your job is to decide whether action is safe and produce a roadmap only where actions are logically grounded in the locked findings.
Do not modify the locked summary or diagnosis.
`;

export const ROADMAP_SYNTHESIS_USER_PROMPT = `
<input_data>
You will be provided with:
1. **LOCKED FINDINGS JSON:** evidence summaries, evidence_summary, diagnosis, and visual_scorecard already created without the tactics KB. Treat these as immutable.
2. **VERIFIED TACTICS DATABASE:** approved remediation mechanisms and tactic IDs.
3. **TACTIC ACTIVITY PLAYBOOK:** KB-aligned implementation activities, roles, artifacts, and acceptance criteria for approved tactic IDs.
4. **METHODOLOGY:** Ready-and-Adapt sequencing.
5. **PHASE 2 METRICS:** numeric confidence signals and Quality Gate precursors.
</input_data>

<reference_material>
${AI_METHODOLOGY_CONTEXT}
</reference_material>

<strict_constraints>
1. **LOCKED FINDINGS:** Do not change, reinterpret, or add factual claims to the evidence summary or diagnosis. The roadmap must answer: what actions logically follow from these findings?
2. **GROUNDING RULE:** Every roadmap action must trace to at least one confirmed gap, confirmed anti-pattern, silent/missing evidence item, or diagnosis statement in LOCKED FINDINGS. Prefer 3-5 actions per phase when the locked findings support them. If a phase has fewer than 3 genuinely grounded actions, return fewer actions rather than inventing filler.
3. **TACTICS KB SCOPE:** Use the Verified Tactics Database and Tactic Activity Playbook only for prescriptions, mechanism names, case-study references, activity detail, artifacts, roles, and acceptance criteria. Never use them to alter current-state findings.
4. **TACTIC ID RULE:** Every prescribed tactic action must include exactly one valid bracketed tactic ID from the database only when that tactic's problem_pattern semantically matches the locked finding. Generic evidence-gathering actions should omit tactic IDs. No tactic ID is better than a wrong tactic ID.
5. **PLANNING DECISION:**
   - GO only when evidence is strong and no unresolved fact-check warnings are being regenerated.
   - CONDITIONAL_GO when action is useful but some source claims, assumptions, or confidence limitations remain.
   - NO_GO when the evidence supports validation only.
6. **NO NEW CURRENT-STATE CLAIMS:** Roadmap and planning_decision may not introduce new assertions about the audited organization that are absent from LOCKED FINDINGS.
7. **NO BASELINE OVERREACH:** Do not prescribe establishing a baseline for a value that is already quantified in the locked findings. Use the existing baseline as evidence and prescribe only the next grounded control.
8. **NO CULTURE/GOVERNANCE OVERREACH:** Do not use culture or governance tactic IDs for generic improvement language. Learning or governance tactics require matching learning, operating rhythm, governance, or ownership gaps in LOCKED FINDINGS.
9. **NO VAGUE MATURITY ACTIONS:** Do not prescribe shifting from activity tracking to outcome tracking, product-level cadence embedding, growth/scale operating model work, or access-pattern baselines unless that exact gap appears in LOCKED FINDINGS.
10. **WHY / WHAT GROUNDING:** Each roadmap phase must include "why" and "what" paragraphs. They are roadmap claims and must be grounded exactly like actions. Do not introduce new current-state facts, unsupported financial impact, or "closes the gap" language unless the locked findings include explicit acceptance criteria proving closure.
11. **ACTIVITY PLAYBOOK BOUNDARY:** Use activity playbook content to make HOW actions concrete only after the tactic's KB coverage and use-when rules match locked findings. Do not force a tactic ID merely because the playbook contains useful generic activities.
12. **PRIVACY LANGUAGE:** Do not name individuals. Avoid repeating the assessed organization/legal entity name; use "the assessed organization" or functional labels such as business, technology, data, platform, risk, service-area, or AI Transformation team.
13. **JSON STRING SAFETY:** No double quotes inside JSON values. Use single quotes or asterisks.
</strict_constraints>

<task>
1. Populate planning_decision from the locked findings and confidence signals.
2. Create a 4-phase remediation_roadmap using Ready-and-Adapt sequencing. Keep all four phase headings, but actions arrays may be empty where the evidence does not support a grounded action:
   - 1. Emerging — Foundation (0-3 Months) = Kickstart setup: thesis, owners, demand routing, impact statement, validation evidence.
   - 2. Structured — Integration (3-6 Months) = Kickstart proof: value-stream pilot, service blueprint, data forensics, lifecycle, safety, pilot playbook.
   - 3. Scaling — Embedding (6-12 Months) = Building the System: service-area team ownership, platform-as-product, data products, operating rhythm, shared learning.
   - 4. Adaptive — Continuous (12+ Months) = Building the System: Sense & Respond, portfolio learning, safe scaling, value realization, readiness reassessment.
3. For every phase:
   - "why": 75-125 words explaining why this phase exists, referencing only locked findings, confirmed gaps, confirmed anti-patterns, missing-evidence needs, diagnosis statements, and matching KB mechanisms.
   - "what": 75-125 words describing the intended change/outcome without inventing unproven benefits or claiming a gap is fully closed unless the locked findings prove the acceptance criteria.
   - "actions": the HOW layer — 3-5 concrete bullets grounded in locked findings where possible. Use the Tactic Activity Playbook for practical activity, owner, artifact, and acceptance language after the tactic is grounded. Include tactic IDs only where the KB problem pattern exactly matches. If fewer than 3 grounded HOW actions exist for a phase, use fewer and do not pad with generic work.
   - Do not write blanket claims that every gap maps to a verified KB tactic. Use narrower wording: source-confirmed gaps drive the roadmap; tactic IDs are used only where an exact KB match is supported.
4. If evidence is low or mixed, use validation actions first and mark assumptions/confidence when requested by the prompt appendix.
</task>

<output_format>
STRICTLY return JSON:
{
  "phase_3_strategy": {
    "planning_decision": {
      "decision": "GO | CONDITIONAL_GO | NO_GO",
      "rationale": "String explaining actionability from locked findings",
      "safe_to_act_on": ["String bullets"],
      "evidence_needed_before_action": ["String bullets"]
    },
    "remediation_roadmap": [
      { "phase": "1. Emerging — Foundation (0-3 Months)", "why": "75-125 grounded words", "what": "75-125 grounded words", "actions": ["3-5 grounded HOW actions where evidence supports them"] },
      { "phase": "2. Structured — Integration (3-6 Months)", "why": "75-125 grounded words", "what": "75-125 grounded words", "actions": ["3-5 grounded HOW actions where evidence supports them"] },
      { "phase": "3. Scaling — Embedding (6-12 Months)", "why": "75-125 grounded words", "what": "75-125 grounded words", "actions": ["3-5 grounded HOW actions where evidence supports them"] },
      { "phase": "4. Adaptive — Continuous (12+ Months)", "why": "75-125 grounded words", "what": "75-125 grounded words", "actions": ["3-5 grounded HOW actions where evidence supports them"] }
    ]
  }
}
</output_format>
`;

export const ROADMAP_SYNTHESIS_PROMPT_CAUTIOUS_APPENDIX = `
<cautious_mode_overrides>
This run produced MEDIUM-confidence evidence. The roadmap may proceed only as CONDITIONAL_GO unless the locked findings clearly state high confidence and no major evidence gaps.
Each remediation_roadmap item MUST include:
- "confidence": "high" | "medium" | "low"
- "assumptions": short assumptions that must hold for that phase to apply.
Prefer baseline/validation actions before scaling controls.
</cautious_mode_overrides>
`;

// ============================================================================
// CAUTIOUS variant — MEDIUM bracket. Same shape as DIRECTIVE but every phase
// declares its confidence and the assumptions that must hold for it to apply.
// Hedged verbs allowed alongside directive ones. Tactic IDs and case studies
// remain in use (and stay verified against the Tactics DB by fact-check).
// ============================================================================
export const STRATEGY_USER_PROMPT_CAUTIOUS = `
${STRATEGY_USER_PROMPT}

<cautious_mode_overrides>
This run produced MEDIUM-confidence evidence (mixed density, some silent areas, partial delivery integrity). Apply these overrides on top of the rules above:

1. **Hedged language permitted alongside directive verbs.** Where evidence directly supports a step, use "Implement"/"Eliminate"/"Enforce". Where evidence is partial or inferred, use "Pilot", "Establish a baseline for", "Validate before scaling". Do NOT use "consider"/"might"/"could" — those remain weasel words.

2. **Per-phase confidence (REQUIRED).** Each entry in remediation_roadmap MUST include a "confidence" field with value "high", "medium", or "low":
   - "high"   = phase is supported by direct evidence in Phase 1/2 and the prerequisite signals exist in the source.
   - "medium" = phase is reasonable given audit findings but rests on assumptions about org context not directly evidenced.
   - "low"    = phase is generic AI Transformation best practice; the source does not yet support a confident prescription.

3. **Per-phase assumptions (REQUIRED).** Each entry MUST include an "assumptions" array — short statements (≤15 words each, max 4 per phase) listing what must hold for the phase to be applicable. Examples: "tag coverage baseline exists today", "engineering teams have dashboard tooling", "finance approves multi-year commitments". If a phase has no non-trivial assumptions, return an empty array.

4. **Persona summaries.** In the 3rd paragraph ("Source Confidence & Boundaries"), include a one-sentence confidence statement that mirrors the strongest phase confidence (e.g., "Evidence confidence is medium overall; the Emerging phase is high-confidence, later phases rest on assumptions about service-area readiness."). Do not place directives in the summary.

5. **Output schema additions.** The remediation_roadmap items now look like:
   { "phase": "1. Emerging — Foundation (0-3 Months)", "why": "75-125 grounded words", "what": "75-125 grounded words", "actions": [...], "confidence": "high|medium|low", "assumptions": ["...", "..."] }
   Keep evidence_summary, diagnosis, planning_decision, executive_summaries, and visual_scorecard in the output shape.
</cautious_mode_overrides>
`;

// ============================================================================
// FINDINGS variant — LOW bracket. NO directive roadmap, NO tactic IDs, NO
// case studies, NO claimed outcomes. The output describes what the audit CAN
// say truthfully and what evidence the user needs to gather before a real
// strategy can be prescribed. The schema diverges materially.
// ============================================================================
export const STRATEGY_USER_PROMPT_FINDINGS = `
<role>
You are an evidence-only AI Transformation reviewer. The audit you are reading produced LOW-confidence signal: insufficient evidence density, low delivery integrity, or too many silent criteria. A directive roadmap would be irresponsible — you would be inventing prescriptions on top of insufficient data.

Instead, produce an HONEST FINDINGS REPORT that tells the reader what the audit can support, what it cannot, and what they need to gather before a real strategy can be written.
</role>

<reference_material>
${AI_METHODOLOGY_CONTEXT}
</reference_material>

<personas>
You still write three persona-tailored evidence summaries (transformation_lead, service_owner, technology_lead). All three describe THE SAME findings. They differ only in vocabulary and emphasis.
${STRATEGY_PERSONAS_BLOCK}
</personas>

<strict_constraints>
1. **NO directive language.** Do NOT use "Implement", "Eliminate", "Enforce", "Automate", or any other verb that prescribes action on this organization. Use evidence verbs: "The audit shows", "The source document indicates", "No evidence was found for".
2. **NO tactic IDs.** Do NOT reference [TAC-XXX-NNN] codes. Do NOT cite external companies (Spotify, Netflix, Airbnb, etc.). The Verified Tactics Database is OFF-LIMITS in this mode.
3. **NO claimed outcomes.** Do NOT promise percentages, savings, or timelines.
4. **NO remediation_roadmap.** Return an empty array for that field.
5. **EVIDENCE REQUIREMENT.** Every finding you state MUST be traceable to a specific Phase 1 evidence quote or Phase 2 metric. If you cannot anchor it, do not state it.
6. **JSON STRING SAFETY.** No double quotes inside string values. Use asterisks for emphasis.
7. **BREVITY.** Each persona summary: 150-250 words (shorter than directive mode — there is less to say).
</strict_constraints>

<task>
1. **Executive summaries (one per persona)** with this 3-paragraph structure:
   **1. What the audit found:** Concise summary of the evidence-backed observations. Reference the Emerging/Structured/Adaptive classification ONLY if Phase 2 metrics directly support it; otherwise say "classification is provisional pending more evidence".
   **2. What is missing:** Explicit list of what the audit could NOT confirm — silent criteria, anti-patterns that were not assessable from source coverage, contradictions in the source, areas where evidence density is too low to score.
   **3. What is needed before a directive roadmap can be written:** The validation plan — what specific source material the next assessment cycle should include.

2. **Visual scorecard** — produce as usual; this is mechanical (Phase 2 numbers).

3. **Findings mode payload (REQUIRED):**
   - "evidence_backed_findings": 4-8 short observations directly traceable to Phase 1/2.
   - "candidate_themes": 3-6 high-level remediation THEMES (NOT directives). Examples: "AI operating rhythm", "responsible AI controls", "service-area ownership". No tactic IDs, no companies.
   - "missing_evidence": 4-8 specific things the source did not contain that would have raised confidence (e.g., "no AI governance policy attached", "no pilot learning review minutes", "no named service-area AI owner").
   - "validation_plan": 3-6 concrete next-cycle actions for the user — what to gather before re-running the assessment.
</task>

<output_format>
STRICTLY return JSON. The schema in FINDINGS mode:
{
  "phase_3_strategy": {
    "executive_summaries": {
      "transformation_lead": "String, Markdown, 3-paragraph structure, 150-250 words",
      "service_owner": "String, Markdown, 3-paragraph structure, 150-250 words",
      "technology_lead": "String, Markdown, 3-paragraph structure, 150-250 words"
    },
    "evidence_summary": {
      "headline": "String, fact-only findings headline",
      "maturity_classification": "Insufficient evidence | Emerging | Structured | Scaling with friction | Adaptive / Value-creating",
      "key_metrics": ["String bullets with Phase 2 numbers"],
      "confirmed_strengths": ["String bullets. AI Transformation-relevant strengths only; in Insufficient evidence, generic facts are source observations, not maturity strengths."],
      "confirmed_gaps": ["String bullets"],
      "confirmed_antipatterns": ["String bullets"],
      "silent_or_missing_evidence": ["String bullets"]
    },
    "diagnosis": {
      "primary_bottleneck": "String, provisional interpretation only",
      "root_causes": ["String bullets"],
      "domain_diagnosis": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "confidence": "low",
      "confidence_rationale": "String"
    },
    "planning_decision": {
      "decision": "NO_GO",
      "rationale": "Evidence does not support a directive roadmap yet.",
      "safe_to_act_on": ["Gather missing evidence", "Validate candidate themes"],
      "evidence_needed_before_action": ["String bullets"]
    },
    "visual_scorecard": {
      "headline": "String (e.g. 'Insufficient Evidence — Provisional Findings Only')",
      "maturity_score": "String",
      "burden_score": "String"
    },
    "remediation_roadmap": [],
    "findings_mode": {
      "evidence_backed_findings": ["..."],
      "candidate_themes": ["..."],
      "missing_evidence": ["..."],
      "validation_plan": ["..."]
    }
  }
}
</output_format>
`;
