import { describe, expect, it } from 'vitest';

import { explainAlternative, explainRule, RULE_EXPLANATIONS } from './rules';

/** Every ruleId the E1.7 corpus exercises. */
const CORPUS_RULE_IDS = [
  'v2-deklarativ',
  'tekamolo-te-lo',
  'praedikativ-final',
  'satzklammer-trennbar',
  'satzklammer-perfekt',
  'satzklammer-modal',
  'negation-vor-klammer',
  'dativ-vor-akkusativ',
  'pronomen-akk-vor-dat',
  'pronomen-vor-nomen',
  'tekamolo-voll',
  'verbletzt',
  'rechte-klammer-nebensatz',
  'nebensatz-im-vorfeld',
  'nachfeld-vergleich',
  'nachfeld-nebensatz',
];

describe('rule explanations', () => {
  it.each(CORPUS_RULE_IDS)('covers %s', (ruleId) => {
    expect(RULE_EXPLANATIONS[ruleId]).toBeDefined();
  });

  it('always returns both languages', () => {
    for (const ruleId of CORPUS_RULE_IDS) {
      const explanation = explainRule(ruleId);
      expect(explanation.de.length).toBeGreaterThan(0);
      expect(explanation.en.length).toBeGreaterThan(0);
    }
  });

  it('falls back to something true rather than inventing a rule', () => {
    const explanation = explainRule('no-such-rule');
    expect(explanation.de).toContain('nicht möglich');
    expect(explanation.en).toContain('not possible');
  });
});

describe('explainAlternative', () => {
  it('names what shifted for an unmarked alternative', () => {
    const note = explainAlternative('morgen', 'TEMP', false);
    expect(note.de).toContain('Auch richtig');
    expect(note.de).toContain('morgen');
    expect(note.de).toContain('Zeitpunkt');
    expect(note.emphasis).toBe('morgen');
  });

  it('says so when the order is marked', () => {
    const note = explainAlternative('vom Bahnhof', 'DIR', true);
    expect(note.de).toContain('ungewöhnlich');
    expect(note.en).toContain('unusual');
  });

  it('still says something useful for a role it has no effect for', () => {
    const note = explainAlternative('dass er kommt', 'NEBENSATZ', false);
    expect(note.de).toBe('Auch richtig.');
    expect(note.emphasis).toBe('dass er kommt');
  });
});
