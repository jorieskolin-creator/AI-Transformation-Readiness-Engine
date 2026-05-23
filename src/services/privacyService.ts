import type { DiagnosticResult } from '../types';

export interface PrivacyScrubOptions {
  redactOrganizationName?: string;
  redactOrganizationNames?: string[];
  redactPersonNames?: boolean;
}

export interface PrivacyScrubReport {
  result: DiagnosticResult;
  changed: boolean;
  replacements: number;
  potentialNames: string[];
}

const PERSON_CONTEXT_RE = /\b(?:prepared by|created by|author|owner|contact|responsible|interviewed|attendee|participant|presenter|reviewer|approver|reported by|submitted by)\s*:?\s+([A-ZÅÄÖ][A-Za-zÅÄÖåäö'’-]+(?:\s+[A-ZÅÄÖ][A-Za-zÅÄÖåäö'’-]+){0,2})\b/gi;
const HONORIFIC_NAME_RE = /\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})\b/g;

const SAFE_PERSON_TERMS = new Set([
  'AI Transformation Lead',
  'Technology Lead',
  'Quality Gate',
  'Evidence Check',
  'Source Confidence',
  'Value Creation',
  'Service Area',
  'Platform Team',
  'Architecture Platform',
  'Learning System',
  'Governance Policy',
  'Planning Decision',
  'Emerging Structured',
  'Structured Adaptive',
  'AI Readiness',
  'AI Governance',
  'AI Architecture',
  'Data Foundation',
  'Power BI',
  'Service Owner',
  'Product Owner',
  'Platform Team',
  'Finance Team',
  'Engineering Team',
  'AI Transformation Team'
]);

const SAFE_ORGANIZATION_TERMS = new Set([
  'AI',
  'IT',
  'EU',
  'GDPR',
  'ISO',
  'NIST',
  'The',
  'This',
  'These',
  'There',
  'No',
  'Yes',
  'Role',
  'Roles',
  'Head',
  'Market',
  'Markets',
  'Service',
  'Area',
  'Practice',
  'Practices',
  'Function',
  'Unit',
  'Units',
  'Team',
  'Teams',
  'Responsibilities',
  'Service Area',
  'Service Practice',
  'Project',
  'Phase',
  'Domain',
  'Batch',
  'Source',
  'Process',
  'Governance',
  'Architecture',
  'Data',
  'Security',
  'Risk',
  'Compliance',
  'Finance',
  'Sales',
  'Business',
  'Customer',
  'Client',
  'Vendor',
  'Supplier',
  'Internal',
  'External',
  'Technology',
  'Platform',
  'Engineering',
  'Knowledge Base',
  'AI Governance',
  'IT Governance',
  'Power BI',
  'Microsoft',
  'Google Cloud'
]);

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSpaces = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const normalizeOrgCandidate = (value: string): string =>
  normalizeSpaces(value)
    .replace(/^[^A-Za-zÅÄÖåäö0-9]+|[^A-Za-zÅÄÖåäö0-9]+$/g, '')
    .replace(/(?:'s|’s)$/i, '')
    .trim();

const isSafeNameCandidate = (value: string): boolean => {
  const normalized = normalizeSpaces(value);
  if (!normalized || SAFE_PERSON_TERMS.has(normalized)) return true;
  if (/\b(AI Transformation|AI Readiness|Governance|Policy|Architecture|Engineering|Technology|Data|Service|Platform|Learning|Value|Organization|Roadmap|Quality|Evidence|Maturity|Emerging|Structured|Adaptive|Summary|Diagnosis|Dashboard|Report)\b/i.test(normalized)) {
    return true;
  }
  return false;
};

const collectPotentialNames = (text: string): string[] => {
  const found = new Set<string>();
  const add = (value?: string) => {
    const normalized = normalizeSpaces(value || '');
    if (!normalized || isSafeNameCandidate(normalized)) return;
    found.add(normalized);
  };
  for (const match of text.matchAll(PERSON_CONTEXT_RE)) add(match[1]);
  for (const match of text.matchAll(HONORIFIC_NAME_RE)) add(match[1]);
  return Array.from(found);
};

const isSafeOrganizationCandidate = (value: string): boolean => {
  const normalized = normalizeOrgCandidate(value);
  if (!normalized || normalized.length < 3) return true;
  if (SAFE_ORGANIZATION_TERMS.has(normalized)) return true;
  if (/^\d/.test(normalized)) return true;
  if (/\b(Process|Policy|Procedure|Report|Assessment|Summary|Dashboard|Plan|Planning|Management|Governance|Architecture|Transformation|Readiness|Engine|Service Area|Service Practice|Decision|Authority|Capacity|Performance|Project Delivery|AI Governance)\b/i.test(normalized)) {
    return true;
  }
  return false;
};

export const collectSourceOrganizationNames = (sourceText: string): string[] => {
  const found = new Map<string, number>();
  const add = (value?: string) => {
    const candidate = normalizeOrgCandidate(value || '');
    if (isSafeOrganizationCandidate(candidate)) return;
    found.set(candidate, (found.get(candidate) || 0) + 1);
  };

  const possessivePattern = /\b([A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{2,}(?:\s+[A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{2,}){0,2})(?:'s|’s)\b/g;
  for (const match of sourceText.matchAll(possessivePattern)) add(match[1]);

  const legalSuffixPattern = /\b([A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{2,}(?:\s+[A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{2,}){0,3}\s+(?:Inc|Ltd|Oy|Oyj|LLC|GmbH|Group|Corporation|Corp|Company|Co))\b/g;
  for (const match of sourceText.matchAll(legalSuffixPattern)) add(match[1]);

  const labeledPattern = /\b(?:company|organization|organisation|customer|client|vendor|supplier|provider|group)\s+(?:name\s*)?:?\s*([A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{2,}(?:\s+[A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{2,}){0,3})\b/gi;
  for (const match of sourceText.matchAll(labeledPattern)) add(match[1]);

  const fromTitlePattern = /\b(?:for|to|at|within|inside)\s+([A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{2,})(?:\s+(?:Group|Corporation|Corp|Company|Oy|Oyj|Ltd|Inc|LLC|GmbH))?\b/g;
  for (const match of sourceText.matchAll(fromTitlePattern)) add(match[1]);

  const repeatedProperPattern = /\b([A-ZÅÄÖ][A-Za-zÅÄÖåäö0-9&.-]{3,})\b/g;
  for (const match of sourceText.matchAll(repeatedProperPattern)) {
    const candidate = normalizeOrgCandidate(match[1]);
    if (isSafeOrganizationCandidate(candidate)) continue;
    found.set(candidate, (found.get(candidate) || 0) + 1);
  }

  return Array.from(found.entries())
    .filter(([term, count]) => count >= 2 || /(?:\s|^)(Inc|Ltd|Oy|Oyj|LLC|GmbH|Group|Corporation|Corp|Company|Co)$/i.test(term))
    .map(([term]) => term)
    .sort((a, b) => b.length - a.length);
};

export const scrubGeneratedText = (
  input: string,
  options: PrivacyScrubOptions = {}
): { text: string; replacements: number; potentialNames: string[] } => {
  if (!input) return { text: input, replacements: 0, potentialNames: [] };
  let text = input;
  let replacements = 0;
  const replace = (pattern: RegExp, token: string) => {
    text = text.replace(pattern, (match) => {
      replacements += 1;
      return token;
    });
  };

  replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[IP_REDACTED]');
  replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, '[PHONE_REDACTED]');
  replace(/AKIA[0-9A-Z]{16}/g, '[AWS_KEY_REDACTED]');
  replace(/(?:sk-|pk_|vercel_blob_rw_)[a-zA-Z0-9_\-]{20,}/g, '[TOKEN_REDACTED]');

  const orgNames = [
    options.redactOrganizationName,
    ...(options.redactOrganizationNames || [])
  ]
    .map(name => normalizeOrgCandidate(name || ''))
    .filter((name, index, all) => name.length >= 2 && all.indexOf(name) === index)
    .sort((a, b) => b.length - a.length);
  for (const orgName of orgNames) {
    replace(new RegExp(`\\b${escapeRegExp(orgName)}(?:'s|’s)?\\b`, 'gi'), '[ORGANIZATION_REDACTED]');
  }

  const potentialNames = collectPotentialNames(text);
  if (options.redactPersonNames) {
    for (const name of potentialNames) {
      replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g'), '[PERSON_NAME_REDACTED]');
    }
  }

  return { text, replacements, potentialNames };
};

const clone = <T>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const scrubStringDeep = (
  value: unknown,
  options: PrivacyScrubOptions,
  stats: { replacements: number; potentialNames: Set<string>; changed: boolean }
): unknown => {
  if (typeof value === 'string') {
    const scrubbed = scrubGeneratedText(value, options);
    stats.replacements += scrubbed.replacements;
    scrubbed.potentialNames.forEach(name => stats.potentialNames.add(name));
    if (scrubbed.text !== value) stats.changed = true;
    return scrubbed.text;
  }
  if (Array.isArray(value)) {
    return value.map(item => scrubStringDeep(item, options, stats));
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      next[key] = scrubStringDeep(child, options, stats);
    }
    return next;
  }
  return value;
};

export const scrubDiagnosticResultForPrivacy = (
  result: DiagnosticResult,
  options: PrivacyScrubOptions = { redactPersonNames: true }
): PrivacyScrubReport => {
  const next = clone(result);
  const stats = { replacements: 0, potentialNames: new Set<string>(), changed: false };
  next.phase_3_strategy = scrubStringDeep(next.phase_3_strategy, options, stats) as DiagnosticResult['phase_3_strategy'];
  if (next.quality_gate) {
    next.quality_gate = scrubStringDeep(next.quality_gate, options, stats) as DiagnosticResult['quality_gate'];
  }
  if ((options.redactOrganizationName || options.redactOrganizationNames?.length) && next.meta?.document_analyzed) {
    const scrubbed = scrubGeneratedText(next.meta.document_analyzed, options);
    next.meta.document_analyzed = scrubbed.text;
    stats.replacements += scrubbed.replacements;
    scrubbed.potentialNames.forEach(name => stats.potentialNames.add(name));
    if (scrubbed.text !== result.meta.document_analyzed) stats.changed = true;
  }
  return {
    result: next,
    changed: stats.changed,
    replacements: stats.replacements,
    potentialNames: Array.from(stats.potentialNames)
  };
};

export const findGeneratedReportPrivacyFindings = (result: DiagnosticResult): string[] => {
  const serialized = JSON.stringify({
    phase_3_strategy: result.phase_3_strategy,
    quality_gate: result.quality_gate
  });
  return collectPotentialNames(serialized);
};
