import { FactCheckClaim, FactCheckResult, StrategySanitationItem } from '../types';
import type { RemoteKnowledgeBaseDocument } from '../types';
import {
  isBlockingUnsupportedClaim,
  isDomainTaxonomyHygieneClaim,
  isMisclassifiedButRealClaim,
  isTacticHygieneClaim
} from './qualityGateService';

const clone = <T>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compact = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const makeItem = (claim: FactCheckClaim, action: StrategySanitationItem['action']): StrategySanitationItem => ({
  action,
  claim: claim.claim,
  rationale: claim.rationale || '',
  source_location: claim.source_location,
  failure_type: claim.failure_type,
  severity: claim.severity,
});

const isAntipatternBurdenInvestmentMisuse = (claim: FactCheckClaim): boolean => {
  const blob = `${claim.claim}\n${claim.rationale}`.toLowerCase();
  return blob.includes('anti-pattern burden') && blob.includes('share of AI investment');
};

const isSanitizableHygieneClaim = (claim: FactCheckClaim): boolean => {
  if (!claim.claim || !claim.source_location) return false;
  return claim.severity === 'WARN_MISCLASSIFIED_BUT_REAL'
    || claim.severity === 'WARN_TACTIC_HYGIENE'
    || isMisclassifiedButRealClaim(claim)
    || isTacticHygieneClaim(claim)
    || isDomainTaxonomyHygieneClaim(claim);
};

const rewriteMetricMisuse = (value: string): { value: string; changed: boolean } => {
  const before = value;
  let next = value.replace(
    /The anti-pattern burden is confirmed at (\d+)%, meaning [^.]*share of AI investment[^.]*\./gi,
    'The confirmed anti-pattern burden index is $1%, based on validated anti-pattern severity rather than AI investment allocation.',
  );
  next = next.replace(
    /anti-pattern burden is confirmed at (\d+)%[^.]*share of AI investment[^.]*/gi,
    'confirmed anti-pattern burden index is $1%, based on validated anti-pattern severity rather than AI investment allocation',
  );
  return { value: next, changed: next !== before };
};

const removeClaimFromString = (value: string, claim: string): { value: string; changed: boolean } => {
  const before = value;
  const exact = claim.trim();
  if (!exact) return { value, changed: false };

  if (value.includes(exact)) {
    const sentencePattern = new RegExp(`(?:^|[\\n\\r]|(?<=[.!?])\\s+)[^.!?\\n\\r]*${escapeRegExp(exact)}[^.!?\\n\\r]*[.!?]?`, 'g');
    let next = value.replace(sentencePattern, ' ');
    if (next === value) next = value.replace(exact, '');
    next = next.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return { value: next, changed: next !== before };
  }

  const normalizedValue = compact(value);
  const normalizedClaim = compact(exact);
  if (normalizedValue.includes(normalizedClaim)) {
    const loose = new RegExp(escapeRegExp(normalizedClaim).replace(/\\ /g, '\\s+'), 'i');
    const next = value.replace(loose, '').replace(/[ \t]{2,}/g, ' ').trim();
    return { value: next, changed: next !== before };
  }

  return { value, changed: false };
};

const basename = (value: string): string =>
  String(value || '').split('/').pop()?.replace(/\.[^.]+$/, '').trim() || '';

export const buildReferenceLeakTerms = (documents: RemoteKnowledgeBaseDocument[] = []): string[] => {
  const terms = new Set<string>();
  const add = (value: any) => {
    const text = compact(String(value || '').replace(/\.[a-z0-9]{2,6}$/i, ''));
    if (text.length >= 8 && !/^internal reference/i.test(text)) terms.add(text);
  };
  for (const doc of documents) {
    add(doc.title);
    add(doc.kb_id);
    add(doc.pathname);
    add(basename(doc.pathname));
  }
  return Array.from(terms).sort((a, b) => b.length - a.length);
};

const REFERENCE_PROVENANCE_PATTERNS = [
  /\baccording to (?:the )?(?:knowledge base|reference knowledge base|reference document|kb)\b/gi,
  /\b(?:the )?(?:knowledge base|reference knowledge base|reference document|kb) (?:states|says|shows|describes|recommends|indicates)\b/gi,
  /\bbased on (?:the )?(?:knowledge base|reference document|internal reference)\b/gi,
];

const replaceReferenceLeaksInString = (
  value: string,
  terms: string[],
): { value: string; changed: boolean; hits: string[] } => {
  let next = value;
  const hits = new Set<string>();
  for (const term of terms) {
    const pattern = new RegExp(escapeRegExp(term), 'gi');
    if (pattern.test(next)) {
      hits.add(term);
      pattern.lastIndex = 0;
      next = next.replace(pattern, 'internal reference material');
    }
  }
  for (const pattern of REFERENCE_PROVENANCE_PATTERNS) {
    if (pattern.test(next)) {
      hits.add('reference provenance language');
      pattern.lastIndex = 0;
      next = next.replace(pattern, 'methodologically');
    }
  }
  next = next.replace(/[ \t]{2,}/g, ' ').trim();
  return { value: next, changed: next !== value, hits: Array.from(hits) };
};

const sanitizeReferenceLeaksDeep = (
  value: any,
  terms: string[],
): { value: any; changed: boolean; hits: string[] } => {
  if (typeof value === 'string') return replaceReferenceLeaksInString(value, terms);
  if (Array.isArray(value)) {
    let changed = false;
    const hits = new Set<string>();
    const items = value.map(item => {
      const sanitized = sanitizeReferenceLeaksDeep(item, terms);
      changed ||= sanitized.changed;
      sanitized.hits.forEach(hit => hits.add(hit));
      return sanitized.value;
    });
    return { value: items, changed, hits: Array.from(hits) };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const hits = new Set<string>();
    const next: any = {};
    for (const [key, child] of Object.entries(value)) {
      const sanitized = sanitizeReferenceLeaksDeep(child, terms);
      changed ||= sanitized.changed;
      sanitized.hits.forEach(hit => hits.add(hit));
      next[key] = sanitized.value;
    }
    return { value: next, changed, hits: Array.from(hits) };
  }
  return { value, changed: false, hits: [] };
};

export const sanitizeStrategyReferenceLeaks = (
  strategyData: any,
  factCheck: FactCheckResult,
  referenceTerms: string[],
): { strategyData: any; factCheck: FactCheckResult; sanitized: StrategySanitationItem[] } => {
  if (!referenceTerms.length && REFERENCE_PROVENANCE_PATTERNS.length === 0) {
    return { strategyData, factCheck, sanitized: [] };
  }
  const data = clone(strategyData);
  const result = sanitizeReferenceLeaksDeep(data.phase_3_strategy, referenceTerms);
  if (!result.changed) return { strategyData, factCheck, sanitized: [] };

  const sanitized: StrategySanitationItem[] = result.hits.map(hit => ({
    action: 'rewritten',
    claim: hit,
    rationale: 'Removed confidential Knowledge Base document, source, or provenance leakage from generated report output.',
    failure_type: 'unverifiable_entity',
    severity: 'BLOCKING_UNSUPPORTED_FACT',
  }));
  data.phase_3_strategy = result.value;
  return {
    strategyData: data,
    factCheck: {
      ...factCheck,
      sanitized_claims: [...(factCheck.sanitized_claims || []), ...sanitized],
    },
    sanitized,
  };
};

const sanitizeStringsDeep = (
  value: any,
  claim: FactCheckClaim,
  mode: 'remove' | 'rewrite',
): { value: any; changed: boolean } => {
  if (typeof value === 'string') {
    return mode === 'rewrite'
      ? rewriteMetricMisuse(value)
      : removeClaimFromString(value, claim.claim);
  }
  if (Array.isArray(value)) {
    let changed = false;
    const items: any[] = [];
    for (const item of value) {
      if (typeof item === 'string' && mode === 'remove') {
        const removed = removeClaimFromString(item, claim.claim);
        if (removed.changed) changed = true;
        if (compact(removed.value).length > 0) items.push(removed.value);
      } else {
        const sanitized = sanitizeStringsDeep(item, claim, mode);
        changed ||= sanitized.changed;
        items.push(sanitized.value);
      }
    }
    return { value: items, changed };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const next: any = {};
    for (const [key, child] of Object.entries(value)) {
      const sanitized = sanitizeStringsDeep(child, claim, mode);
      changed ||= sanitized.changed;
      next[key] = sanitized.value;
    }
    return { value: next, changed };
  }
  return { value, changed: false };
};

const removeRoadmapAction = (strategy: any, claim: FactCheckClaim): boolean => {
  const roadmap = strategy?.phase_3_strategy?.remediation_roadmap;
  if (!Array.isArray(roadmap)) return false;
  let changed = false;
  const claimText = compact(claim.claim);
  if (!claimText) return false;
  const claimLower = claimText.toLowerCase();
  for (const phase of roadmap) {
    if (!Array.isArray(phase?.actions)) continue;
    const kept: string[] = [];
    for (const action of phase.actions) {
      const actionText = compact(String(action || ''));
      if (!actionText) continue;
      const actionLower = actionText.toLowerCase();
      const matches = actionLower.includes(claimLower) || claimLower.includes(actionLower);
      if (matches) {
        changed = true;
      } else {
        kept.push(action);
      }
    }
    phase.actions = kept;
  }
  return changed;
};

export const sanitizeStrategyAfterFactCheck = (
  strategyData: any,
  factCheck: FactCheckResult,
): { strategyData: any; factCheck: FactCheckResult; sanitized: StrategySanitationItem[] } => {
  if (factCheck.failed || factCheck.unsupported_claims.length === 0) {
    return { strategyData, factCheck, sanitized: [] };
  }

  let data = clone(strategyData);
  const remaining: FactCheckClaim[] = [];
  const sanitized: StrategySanitationItem[] = [];

  for (const claim of factCheck.unsupported_claims) {
    if (!isBlockingUnsupportedClaim(claim)) {
      if (isSanitizableHygieneClaim(claim)) {
        const result = sanitizeStringsDeep(data.phase_3_strategy, claim, 'remove');
        if (result.changed) {
          data.phase_3_strategy = result.value;
          sanitized.push(makeItem(claim, 'quarantined'));
          continue;
        }
      }
      remaining.push(claim);
      continue;
    }

    if (isAntipatternBurdenInvestmentMisuse(claim)) {
      const result = sanitizeStringsDeep(data.phase_3_strategy, claim, 'rewrite');
      if (result.changed) {
        data.phase_3_strategy = result.value;
        sanitized.push(makeItem(claim, 'rewritten'));
        continue;
      }
    }

    if (claim.source_location === 'roadmap') {
      if (removeRoadmapAction(data, claim)) {
        const result = sanitizeStringsDeep(data.phase_3_strategy, claim, 'remove');
        if (result.changed) {
          data.phase_3_strategy = result.value;
        }
        sanitized.push(makeItem(claim, 'removed'));
        continue;
      }
    }

    const result = sanitizeStringsDeep(data.phase_3_strategy, claim, 'remove');
    if (result.changed) {
      data.phase_3_strategy = result.value;
      sanitized.push(makeItem(claim, 'quarantined'));
      continue;
    }

    remaining.push(claim);
  }

  return {
    strategyData: data,
    factCheck: {
      ...factCheck,
      unsupported_claims: remaining,
      sanitized_claims: [...(factCheck.sanitized_claims || []), ...sanitized],
    },
    sanitized,
  };
};
