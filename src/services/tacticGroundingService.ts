import type { Phase2Validation, StrategicTactic } from '../types';
import { AI_TACTICS_LOCAL } from '../knowledge_base';

export interface TacticGroundingAdjustment {
  action_before: string;
  action_after: string;
  tactic_id: string;
  replacement_id?: string;
  reason: string;
}

export interface TacticGroundingResult {
  strategyData: any;
  adjustments: TacticGroundingAdjustment[];
  warnings: string[];
}

interface TacticSemanticRule {
  requiredFindingKeywords?: string[];
  actionKeywords?: string[];
  replacementWhenActionMatches?: Array<{ keywords: string[]; id: string }>;
}

interface UnsupportedActionRule {
  actionKeywords: string[];
  requiredFindingKeywords: string[];
  reason: string;
}

const TACTIC_RULES: Record<string, TacticSemanticRule> = {
  'TAC-OPS-001': { requiredFindingKeywords: ['decision', 'operating rhythm', 'governance fat', 'decision rights', 'cadence'] },
  'TAC-OPS-002': { requiredFindingKeywords: ['demand routing', 'one-size', 'delivery model', 'uncertainty', 'intake'] },
  'TAC-OPS-003': { requiredFindingKeywords: ['pilot', 'launch-and-learn', 'vertical slice', 'pilot purgatory', 'experiment'] },
  'TAC-OPS-004': { requiredFindingKeywords: ['learning', 'hero culture', 'community', 'playbook', 'repeated mistakes'] },
  'TAC-WORK-001': { requiredFindingKeywords: ['work redesign', 'workslop', 'digital taylorism', 'human-in-the-loop', 'cognitive load'] },
  'TAC-ARCH-001': { requiredFindingKeywords: ['integration', 'service boundary', 'legacy', 'connector', 'brittle'] },
  'TAC-ARCH-002': { requiredFindingKeywords: ['lifecycle', 'version', 'prompt', 'model', 'release', 'rollback', 'trace'] },
  'TAC-ARCH-003': { requiredFindingKeywords: ['observability', 'evaluation', 'drift', 'groundedness', 'black-box'] },
  'TAC-RISK-001': { requiredFindingKeywords: ['safety', 'guardrail', 'risk', 'agent', 'human oversight', 'behavioral contract'] },
  'TAC-PLAT-001': { requiredFindingKeywords: ['platform', 'fragmentation', 'hidden factory', 'model gateway', 'reusable'] },
  'TAC-STRAT-001': { requiredFindingKeywords: ['strategy', 'thesis', 'slogan', 'where not to use', 'purpose'] },
  'TAC-VALUE-001': { requiredFindingKeywords: ['impact statement', 'value hypothesis', 'vanity', 'use-case chasing', 'portfolio'] },
  'TAC-DATA-001': { requiredFindingKeywords: ['data owner', 'domain-owned', 'context', 'semantic', 'meaning'] },
  'TAC-DATA-002': { requiredFindingKeywords: ['lineage', 'quality', 'freshness', 'trace', 'data swamp'] },
  'TAC-DATA-003': { requiredFindingKeywords: ['retrieval', 'rag', 'embedding', 'feature', 'knowledge store'] },
  'TAC-SVC-001': { requiredFindingKeywords: ['service blueprint', 'capability', 'value stream', 'service area', 'customer journey'] },
  'TAC-SVC-002': { requiredFindingKeywords: ['scaling', 'big-bang', 'rollout', 'service readiness', 'safe scaling'] }
};

const TACTIC_RX = /\[(TAC-[A-Z]+-\d+(?:-[A-Z]+)?)\]/g;

const UNSUPPORTED_ACTION_RULES: UnsupportedActionRule[] = [
  {
    actionKeywords: ['activity-based', 'outcome-based'],
    requiredFindingKeywords: ['activity-based', 'vanity', 'use-case chasing', 'no enterprise-level impact', 'no measurable outcome'],
    reason: 'Removed outcome-tracking action because the locked findings do not say current measurement is activity-based or performative.'
  },
  {
    actionKeywords: ['product team growth'],
    requiredFindingKeywords: ['product team growth', 'team growth', 'scaling pressure', 'operating model strain'],
    reason: 'Removed operating-model growth action because the locked findings do not say product-team growth is stressing the AI Transformation cadence.'
  }
];

const lower = (value: unknown): string => typeof value === 'string' ? value.toLowerCase() : '';

const includesAny = (haystack: string, needles: string[] | undefined): boolean =>
  !!needles?.some((needle) => haystack.includes(needle.toLowerCase()));

const includesAll = (haystack: string, needles: string[]): boolean =>
  needles.every((needle) => haystack.includes(needle.toLowerCase()));

const buildFindingCorpus = (phase2: Phase2Validation): string => [
  ...phase2.maturity_gaps,
  ...phase2.antipattern_findings,
  ...phase2.silent_areas,
  phase2.metrics.readiness_cap_reason || ''
].join('\n').toLowerCase();

const tacticById = new Map<string, StrategicTactic>(AI_TACTICS_LOCAL.map(t => [t.id, t]));

const applyReplacementOrRemoval = (
  action: string,
  id: string,
  replacementId: string | undefined,
  reason: string,
  adjustments: TacticGroundingAdjustment[]
): string => {
  const before = action;
  const after = replacementId
    ? action.replace(`[${id}]`, `[${replacementId}]`)
    : action.replace(new RegExp(`\\s*\\[${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), '');
  if (after !== before) {
    adjustments.push({
      action_before: before,
      action_after: after,
      tactic_id: id,
      replacement_id: replacementId,
      reason
    });
  }
  return after;
};

const removeUnsupportedActionIfNeeded = (
  action: string,
  findingCorpus: string,
  adjustments: TacticGroundingAdjustment[]
): string | undefined => {
  const actionText = lower(action);
  const rule = UNSUPPORTED_ACTION_RULES.find(candidate =>
    includesAll(actionText, candidate.actionKeywords) &&
    !includesAny(findingCorpus, candidate.requiredFindingKeywords)
  );
  if (!rule) return action;
  adjustments.push({
    action_before: action,
    action_after: '',
    tactic_id: 'ACTION',
    reason: rule.reason
  });
  return undefined;
};

export const sanitizeRoadmapTacticGrounding = (
  strategyData: any,
  phase2: Phase2Validation
): TacticGroundingResult => {
  const strategy = strategyData?.phase_3_strategy;
  const roadmap = strategy?.remediation_roadmap;
  if (!strategy || !Array.isArray(roadmap)) {
    return { strategyData, adjustments: [], warnings: [] };
  }

  const data = JSON.parse(JSON.stringify(strategyData));
  const clonedRoadmap = data.phase_3_strategy.remediation_roadmap;
  const findingCorpus = buildFindingCorpus(phase2);
  const adjustments: TacticGroundingAdjustment[] = [];

  for (const phase of clonedRoadmap) {
    if (!Array.isArray(phase.actions)) continue;
    phase.actions = phase.actions.map((rawAction: unknown) => {
      let action = typeof rawAction === 'string' ? rawAction : String(rawAction ?? '');
      const groundedAction = removeUnsupportedActionIfNeeded(action, findingCorpus, adjustments);
      if (groundedAction === undefined) return '';
      action = groundedAction;
      const actionText = lower(action);
      const ids = Array.from(action.matchAll(TACTIC_RX)).map(m => m[1]);
      for (const id of ids) {
        const rule = TACTIC_RULES[id];
        const tactic = tacticById.get(id);
        if (!rule || !tactic) continue;

        const replacement = rule.replacementWhenActionMatches
          ?.find(candidate => includesAny(actionText, candidate.keywords));
        if (replacement) {
          action = applyReplacementOrRemoval(
            action,
            id,
            replacement.id,
            `${id} was replaced because the action language matches ${replacement.id}, not ${tactic.canonical_name || id}.`,
            adjustments
          );
          continue;
        }

        const matchesAction = includesAny(actionText, rule.requiredFindingKeywords);
        const matchesFinding = includesAny(findingCorpus, rule.requiredFindingKeywords);
        if (!matchesAction || !matchesFinding) {
          action = applyReplacementOrRemoval(
            action,
            id,
            undefined,
            `${id} was removed because its problem pattern was not present in both the action and the locked findings.`,
            adjustments
          );
        }
      }
      return action.trim().replace(/\s{2,}/g, ' ');
    }).filter((action: string) => action.length > 0);
  }

  const warnings = adjustments.map(a =>
    a.tactic_id === 'ACTION'
      ? `Roadmap grounding removed unsupported action: ${a.reason}`
      : a.replacement_id
      ? `Roadmap tactic grounding adjusted ${a.tactic_id} → ${a.replacement_id}: ${a.reason}`
      : `Roadmap tactic grounding removed ${a.tactic_id}: ${a.reason}`
  );

  return { strategyData: data, adjustments, warnings };
};
