
import DOMPurify from 'dompurify';
import { ImageInput } from '../types';

export const forensicSanitizeImport = (dirtyHtml: string): string => {
  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'onmouseover', 'onclick', 'onerror', 'onload']
  });
};

export const generateSafetyAuditPrompt = (reviewPacket: string, images?: ImageInput[]) => {
  const imageCount = images?.length ?? 0;
  return `
<task>
You are a **Data Loss Prevention (DLP) Officer** for an AI Transformation Assessment Engine.
Scan the following distributed review packet${imageCount > 0 ? ` AND the ${imageCount} attached image part(s)` : ''} for High-Risk Content.

The deterministic scanner has already inspected the full parsed source registry. Your role is to review representative chunks from the beginning, middle, end, table/profile areas, parse-warning areas, and any regex-risk areas. Do not assume this packet is the whole customer source; use it as a safety review sample.

**HIGH-RISK CATEGORIES:**
1. **PII:** Social Security Numbers, Passport Numbers, Home Addresses, Personal Financial Data${imageCount > 0 ? ', faces of individuals in screenshots with names visible, employee photos' : ''}.
2. **SECRETS:** API Keys (AWS AKIA*, Azure keys, GCP service account keys), Passwords, Private Keys, Tokens${imageCount > 0 ? '. In images, look for visible keys in console screenshots, passwords on sticky notes, login screens with credentials, terminal output exposing tokens' : ''}.
3. **CLOUD CREDENTIALS:** Cloud account IDs with associated access keys, billing account numbers with pricing details${imageCount > 0 ? '. In images, check for visible account numbers next to access keys, billing-console screenshots showing exact dollar amounts and account IDs together' : ''}.
4. **FINANCIAL SENSITIVITY:** Exact contract values, specific negotiated discount rates, EDP pricing terms (flag but do not block — mark as CAUTION).
5. **IRRELEVANCE:** Cooking recipes, fiction, code repositories, or gibberish${imageCount > 0 ? '. For images: non-AI Transformation content (vacation photos, memes, unrelated screenshots)' : ''}.

**IMPORTANT:** Documents about AI values, budgets, and AI Transformation strategies are EXPECTED and should pass even if they mention dollar amounts in a business context. Only flag raw financial instruments or personal financial data.
${imageCount > 0 ? `\n**IMAGE-SPECIFIC GUIDANCE:** Dashboard screenshots, architecture diagrams, org charts, and PDF pages rendered as images are all EXPECTED AI Transformation content. Pass them unless they visibly contain one of the HIGH-RISK CATEGORIES above. A redacted dashboard or one showing percentages without raw dollar amounts is safe.\n` : ''}
**OUTPUT FORMAT:**
Return a JSON object ONLY:
{
  "safe": boolean,
  "risk_detected": "None" | "PII" | "Secrets" | "CloudCredentials" | "FinancialSensitivity" | "Irrelevant",
  "reason": "Short explanation${imageCount > 0 ? '. Name the image filename and approximate location if a secret was visible in an image.' : ''}",
  "caution_notes": "Optional: notes about financial sensitivity that should be handled with care"
}
</task>

<text_sample>
${reviewPacket.substring(0, 40000)}
</text_sample>
`;
};

export const validateMetadataPayload = (payload: any): boolean => {
  if (!payload) return false;
  const size = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (size > 500000) return false;
  const validKeys = ['meta', 'phase_1_audit_logs', 'phase_2_validation', 'phase_3_strategy'];
  return validKeys.every(k => k in payload);
};
