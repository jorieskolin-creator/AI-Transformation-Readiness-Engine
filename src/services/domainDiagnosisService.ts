import type { AuditItem, Phase1AuditLogs, Phase2Validation } from '../types';
import { AI_ANTIPATTERNS, AI_CRITERIA, BATCH_TITLES } from '../knowledge_base';

const DOMAIN_IDS = ['A', 'B', 'C', 'D', 'E'] as const;

const criterionTitles = new Map<string, string>([
  ...AI_CRITERIA.map(c => [c.id, c.title] as const),
  ...AI_ANTIPATTERNS.map(c => [c.id, c.title] as const),
]);

const itemEntriesForDomain = (
  items: Record<string, AuditItem>,
  domainId: string,
): Array<[string, AuditItem]> =>
  Object.entries(items || {})
    .filter(([id]) => id.startsWith(domainId))
    .sort(([a], [b]) => a.localeCompare(b));

const countBy = (items: Array<[string, AuditItem]>, predicate: (item: AuditItem) => boolean): number =>
  items.filter(([, item]) => predicate(item)).length;

const itemLabel = (id: string): string => {
  const title = criterionTitles.get(id);
  return title ? `${id} ${title}` : id;
};

const topLabels = (items: Array<[string, AuditItem]>, max = 2): string =>
  items
    .slice(0, max)
    .map(([id]) => itemLabel(id))
    .join('; ');

const hasSourceCoverage = (item: AuditItem): boolean =>
  item.count > 0 ||
  item.evidence_check_status === 'supported' ||
  item.evidence_check_status === 'weak' ||
  (Array.isArray(item.evidence_quotes) && item.evidence_quotes.length > 0);

const sourceCoveragePhrase = (items: Array<[string, AuditItem]>): string => {
  const categories = new Set<string>();
  for (const [, item] of items) {
    for (const quote of item.evidence_quotes || []) {
      if (quote.category) categories.add(quote.category);
    }
  }
  if (categories.size === 0) return 'No criterion-specific source coverage was verified for this domain.';
  return `Verified source coverage is mostly ${Array.from(categories).slice(0, 4).join(', ')} evidence.`;
};

const buildDomainDiagnosis = (
  domainId: string,
  phase1: Phase1AuditLogs,
  phase2: Phase2Validation,
): string => {
  const maturityItems = itemEntriesForDomain(phase1.maturity, domainId);
  const antipatternItems = itemEntriesForDomain(phase1.antipattern, domainId);
  const label = BATCH_TITLES[domainId] || `Domain ${domainId}`;
  const score = phase2.category_scores?.[domainId] ?? 0;

  const maturitySignals = maturityItems.filter(([, item]) => item.count > 0);
  const supportedMaturity = maturityItems.filter(([, item]) => item.count > 0 && item.evidence_check_status !== 'unsupported' && item.evidence_check_status !== 'missing');
  const silentMaturity = maturityItems.filter(([, item]) => item.count === 0 && !hasSourceCoverage(item));
  const antipatternSignals = antipatternItems.filter(([, item]) => item.count > 0);
  const testedAbsent = antipatternItems.filter(([, item]) => item.antipattern_absence_status === 'tested_absent');

  const parts = [
    `${domainId} - ${label}: maturity signal ${score}/15.`,
  ];

  if (supportedMaturity.length > 0) {
    parts.push(`Partial or stronger maturity evidence appears in ${topLabels(supportedMaturity)}.`);
  } else if (maturitySignals.length > 0) {
    parts.push(`Some related source signal was found, but it remained weak or unsupported after verification.`);
  } else {
    parts.push(`No verified maturity evidence was strong enough to score this domain above zero.`);
  }

  if (antipatternSignals.length > 0) {
    parts.push(`Anti-pattern signal appears in ${topLabels(antipatternSignals)}.`);
  } else if (testedAbsent.length > 0) {
    parts.push(`Anti-pattern absence was meaningfully tested for ${countBy(antipatternItems, item => item.antipattern_absence_status === 'tested_absent')} item(s).`);
  } else {
    parts.push(`Anti-pattern absence is mostly unknown, not proven healthy.`);
  }

  if (silentMaturity.length > 0) {
    parts.push(`${silentMaturity.length} maturity criterion/criteria remain silent or not evidenced for this domain.`);
  }

  parts.push(sourceCoveragePhrase([...maturityItems, ...antipatternItems]));
  return parts.join(' ');
};

export const buildDeterministicDomainDiagnosis = (
  phase1: Phase1AuditLogs,
  phase2: Phase2Validation,
): Record<string, string> =>
  Object.fromEntries(DOMAIN_IDS.map(domainId => [
    domainId,
    buildDomainDiagnosis(domainId, phase1, phase2),
  ]));

export const normalizeDomainDiagnosis = (
  strategyData: any,
  phase1: Phase1AuditLogs,
  phase2: Phase2Validation,
): any => {
  if (!strategyData?.phase_3_strategy?.diagnosis) return strategyData;
  return {
    ...strategyData,
    phase_3_strategy: {
      ...strategyData.phase_3_strategy,
      diagnosis: {
        ...strategyData.phase_3_strategy.diagnosis,
        domain_diagnosis: buildDeterministicDomainDiagnosis(phase1, phase2),
      },
    },
  };
};
