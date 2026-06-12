import type { QualityGateDecision } from '../types';

export const insufficientEvidenceLabel = 'Insufficient evidence';
export const sourceObservationLabel = 'Source observations outside AI Transformation scope';
export const confirmedStrengthsLabel = 'Confirmed strengths';

export const isInsufficientEvidenceReport = (
  maturityClassification?: string,
  evidenceDensity?: number,
  qualityGateDecision?: QualityGateDecision
): boolean => {
  if (qualityGateDecision === 'BLOCK') return true;
  if (typeof evidenceDensity === 'number' && evidenceDensity < 30) return true;
  return (maturityClassification || '').toLowerCase().includes('insufficient');
};

export const strengthsSectionTitle = (isInsufficientEvidence: boolean): string =>
  isInsufficientEvidence ? sourceObservationLabel : confirmedStrengthsLabel;

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripMarkdownLinks = (text: string): string =>
  text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

export const renderInlineMarkdownHtml = (text: string): string => {
  const escaped = escapeHtml(stripMarkdownLinks(text));
  return escaped
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
};

export const renderMarkdownSummaryHtml = (content: string): string => {
  if (!content.trim()) return '';
  return content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      const body = lines.map(renderInlineMarkdownHtml).join('<br>');
      return `<p class="summary-paragraph">${body}</p>`;
    })
    .join('');
};

export const softenVisualOnlySourceWording = (text: string): string => {
  if (!text) return text;
  return text
    .replace(
      /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:submitted\s+)?PDF(?:\s+(?:documents?|submissions?|sources?))?)\s+returned zero extractable text,?\s+contributing no assessable evidence\b/gi,
      '$1 had no extractable text layer; rendered page images were used where available, so confidence depends on visual interpretation'
    )
    .replace(
      /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:submitted\s+)?PDF(?:\s+(?:documents?|submissions?|sources?))?)\s+returned zero extractable text\b/gi,
      '$1 had no extractable text layer; rendered page images were used where available'
    )
    .replace(
      /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+scanned PDFs?)\s+returned zero extractable text\b/gi,
      '$1 had no extractable text layer; rendered page images were used where available'
    )
    .replace(
      /\bfully unreadable due to image-only encoding\b/gi,
      'text-layer unreadable and assessed as visual-only material where rendered page images were available'
    )
    .replace(
      /\btheir content (?:could not be assessed|was entirely unknown)\b/gi,
      'their text layer could not be assessed; visual content was reviewed where rendered images were available'
    )
    .replace(
      /\bcontributing no assessable evidence\b/gi,
      'contributing no extractable text evidence; visual evidence was considered where available'
    );
};

export const softenVisualOnlySourceWordingDeep = <T>(value: T): T => {
  if (typeof value === 'string') return softenVisualOnlySourceWording(value) as T;
  if (Array.isArray(value)) return value.map(item => softenVisualOnlySourceWordingDeep(item)) as T;
  if (value && typeof value === 'object') {
    const next: any = { ...(value as any) };
    for (const [key, child] of Object.entries(next)) {
      next[key] = softenVisualOnlySourceWordingDeep(child);
    }
    return next as T;
  }
  return value;
};
