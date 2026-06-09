// Central model registry. EDIT THIS FILE to retune the pipeline. Each stage of
// the assessment maps to a named model profile and an ordered fallback chain.
// Runtime routing is intentionally OpenAI + Anthropic only.

export type Provider = 'anthropic' | 'openai';

export interface AnthropicThinkingConfig {
  type: 'enabled';
  budget_tokens: number;
}

export interface OpenAIReasoningConfig {
  effort: 'none' | 'low' | 'medium' | 'high' | 'xhigh';
}

export interface ModelProfile {
  id: string;
  provider: Provider;
  anthropicThinking?: AnthropicThinkingConfig;
  openaiReasoning?: OpenAIReasoningConfig;
  maxTokens?: number;
}

export type StageId =
  | 'preflight'
  | 'forensic_audit'
  | 'targeted_rescan'
  | 'evidence_check'
  | 'evidence_adjudication'
  | 'synthesis'
  | 'roadmap_synthesis'
  | 'synthesis_escalation'
  | 'fact_check'
  | 'fact_check_high'
  | 'quality_gate';

export const PROFILES = {
  SONNET_46: {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    maxTokens: 8192,
  } satisfies ModelProfile,

  OPUS_47: {
    id: 'claude-opus-4-7',
    provider: 'anthropic',
    maxTokens: 8192,
  } satisfies ModelProfile,

  GPT_55_PREFLIGHT: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'low' },
    maxTokens: 8192,
  } satisfies ModelProfile,

  GPT_55_AUDIT: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'medium' },
    maxTokens: 12000,
  } satisfies ModelProfile,

  GPT_55_EVIDENCE_CHECK: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'medium' },
    maxTokens: 12000,
  } satisfies ModelProfile,

  GPT_55_SYNTHESIS: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'medium' },
    maxTokens: 12000,
  } satisfies ModelProfile,

  GPT_55_ESCALATION: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'high' },
    maxTokens: 12000,
  } satisfies ModelProfile,

  GPT_55_FACT_CHECK: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'medium' },
    maxTokens: 12000,
  } satisfies ModelProfile,

  GPT_55_FACT_CHECK_HIGH: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'high' },
    maxTokens: 12000,
  } satisfies ModelProfile,

  GPT_55_QUALITY_GATE: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'medium' },
    maxTokens: 8192,
  } satisfies ModelProfile,

  GPT_55_ROADMAP: {
    id: 'gpt-5.5',
    provider: 'openai',
    openaiReasoning: { effort: 'medium' },
    maxTokens: 12000,
  } satisfies ModelProfile,
} as const;

export const STAGE_MODELS: Record<StageId, ModelProfile> = {
  preflight:             PROFILES.GPT_55_PREFLIGHT,
  forensic_audit:        PROFILES.SONNET_46,
  targeted_rescan:       PROFILES.OPUS_47,
  evidence_check:        PROFILES.GPT_55_EVIDENCE_CHECK,
  evidence_adjudication: PROFILES.GPT_55_FACT_CHECK,
  synthesis:             PROFILES.SONNET_46,
  roadmap_synthesis:     PROFILES.OPUS_47,
  synthesis_escalation:  PROFILES.OPUS_47,
  fact_check:            PROFILES.GPT_55_FACT_CHECK,
  fact_check_high:       PROFILES.GPT_55_FACT_CHECK_HIGH,
  quality_gate:          PROFILES.GPT_55_QUALITY_GATE,
};

export const FALLBACK_CHAIN: Record<StageId, ModelProfile[]> = {
  preflight:             [PROFILES.SONNET_46],
  forensic_audit:        [PROFILES.GPT_55_AUDIT, PROFILES.OPUS_47],
  targeted_rescan:       [PROFILES.GPT_55_ROADMAP, PROFILES.SONNET_46],
  evidence_check:        [PROFILES.SONNET_46, PROFILES.OPUS_47],
  evidence_adjudication: [PROFILES.OPUS_47],
  synthesis:             [PROFILES.GPT_55_SYNTHESIS, PROFILES.OPUS_47],
  roadmap_synthesis:     [PROFILES.GPT_55_ROADMAP, PROFILES.SONNET_46],
  synthesis_escalation:  [PROFILES.GPT_55_ESCALATION, PROFILES.SONNET_46],
  fact_check:            [PROFILES.SONNET_46],
  fact_check_high:       [PROFILES.SONNET_46],
  quality_gate:          [PROFILES.SONNET_46],
};

export function modelsFor(stage: StageId): ModelProfile[] {
  return [STAGE_MODELS[stage], ...FALLBACK_CHAIN[stage]];
}

export const MODEL_PHASE1: ModelProfile = STAGE_MODELS.forensic_audit;
export const MODEL_PHASE3: ModelProfile = STAGE_MODELS.synthesis;
