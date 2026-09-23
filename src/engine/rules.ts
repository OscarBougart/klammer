/**
 * Rule explanations — E3.4.
 *
 * design.md §5: a wrong answer names the *rule*, not the position. "Das finite
 * Verb steht an zweiter Stelle" teaches something reusable; "tile 3 is in the
 * wrong place" teaches nothing.
 *
 * German first, English underneath in the muted tone. Both languages always —
 * a learner who can read the German alone will stop reading the second line on
 * their own, which is the point.
 *
 * Keyed by the `ruleId` the sentence was authored with. An unknown id is a
 * content bug, not a runtime one: the fallback says something true and general
 * rather than inventing a rule that does not exist.
 */

export type Explanation = {
  /** German. Shown first, in `kreide`. */
  de: string;
  /** English gloss. Shown underneath, in `grau`. */
  en: string;
};

export const RULE_EXPLANATIONS: Record<string, Explanation> = {
  'v2-deklarativ': {
    de: 'Das finite Verb steht im Hauptsatz immer an zweiter Stelle.',
    en: 'The finite verb is always second in a main clause.',
  },

  'satzklammer-trennbar': {
    de: 'Die Vorsilbe steht am Ende und schließt die Satzklammer.',
    en: 'The separable prefix goes to the end and closes the bracket.',
  },

  'satzklammer-perfekt': {
    de: 'Das Partizip steht am Satzende, das Hilfsverb an zweiter Stelle.',
    en: 'The participle closes the sentence; the auxiliary is second.',
  },

  'satzklammer-modal': {
    de: 'Das Modalverb steht an zweiter Stelle, der Infinitiv ganz am Ende.',
    en: 'The modal verb is second; the infinitive closes the sentence.',
  },

  'negation-vor-klammer': {
    de: '„nicht" steht direkt vor der rechten Satzklammer.',
    en: '"nicht" sits immediately before the right bracket.',
  },

  'tekamolo-te-lo': {
    de: 'Zeitangaben stehen vor Ortsangaben: erst wann, dann wo.',
    en: 'Time before place: when first, then where.',
  },

  'tekamolo-voll': {
    de: 'Angaben folgen der Reihenfolge temporal – kausal – modal – lokal.',
    en: 'Adverbials run time – reason – manner – place.',
  },

  'praedikativ-final': {
    de: 'Das Prädikativ steht am Ende des Mittelfelds.',
    en: 'The predicative closes the middle field.',
  },

  'dativ-vor-akkusativ': {
    de: 'Bei zwei Nomen steht das Dativobjekt vor dem Akkusativobjekt.',
    en: 'With two full nouns, dative comes before accusative.',
  },

  'pronomen-akk-vor-dat': {
    de: 'Bei zwei Pronomen steht das Akkusativpronomen vor dem Dativpronomen.',
    en: 'With two pronouns, accusative comes before dative — the reverse of nouns.',
  },

  'pronomen-vor-nomen': {
    de: 'Pronomen stehen vor Nomen, gleich am Anfang des Mittelfelds.',
    en: 'Pronouns come before nouns, at the front of the middle field.',
  },

  verbletzt: {
    de: 'Im Nebensatz steht das finite Verb am Ende.',
    en: 'In a subordinate clause the finite verb goes last.',
  },

  'rechte-klammer-nebensatz': {
    de: 'Im Nebensatz steht der Infinitiv vor dem finiten Verb.',
    en: 'In a subordinate clause the infinitive precedes the finite verb.',
  },

  'nebensatz-im-vorfeld': {
    de: 'Ein Nebensatz im Vorfeld füllt das ganze Vorfeld — das Verb folgt direkt.',
    en: 'A subordinate clause in the Vorfeld fills it entirely; the verb follows immediately.',
  },

  'nachfeld-vergleich': {
    de: 'Der Vergleich mit „als" steht meist im Nachfeld, hinter der Klammer.',
    en: 'A comparison with "als" usually sits in the Nachfeld, outside the bracket.',
  },

  'nachfeld-nebensatz': {
    de: 'Ein Nebensatz steht im Nachfeld, hinter der rechten Klammer.',
    en: 'A subordinate clause sits in the Nachfeld, after the right bracket.',
  },
};

const FALLBACK: Explanation = {
  de: 'Diese Reihenfolge ist im Deutschen nicht möglich.',
  en: 'That order is not possible in German.',
};

export function explainRule(ruleId: string): Explanation {
  return RULE_EXPLANATIONS[ruleId] ?? FALLBACK;
}

/**
 * The "auch richtig" line — design.md §5:
 *
 *   Auch richtig. Mit **morgen** im Vorfeld liegt die Betonung auf dem
 *   Zeitpunkt.
 *
 * What shifted depends on what the learner put in the Vorfeld, so the message
 * is built from their answer rather than stored per sentence. `emphasis`
 * carries the fronted constituent so the UI can set it in the bold face.
 */
export type AlternativeNote = Explanation & { emphasis?: string };

/** What fronting each kind of constituent does to the emphasis. */
const FRONTED_EFFECT: Record<string, Explanation> = {
  TEMP: {
    de: 'liegt die Betonung auf dem Zeitpunkt.',
    en: 'puts the emphasis on when.',
  },
  KAUS: {
    de: 'liegt die Betonung auf dem Grund.',
    en: 'puts the emphasis on why.',
  },
  LOK: {
    de: 'liegt die Betonung auf dem Ort.',
    en: 'puts the emphasis on where.',
  },
  DIR: {
    de: 'liegt die Betonung auf der Richtung.',
    en: 'puts the emphasis on where to — it answers "where from?" or "where to?".',
  },
  MODAL: {
    de: 'liegt die Betonung auf der Art und Weise.',
    en: 'puts the emphasis on how.',
  },
  AKK: {
    de: 'wird das Objekt zum Thema des Satzes.',
    en: 'makes the object the topic of the sentence.',
  },
  DAT: {
    de: 'wird das Objekt zum Thema des Satzes.',
    en: 'makes the object the topic of the sentence.',
  },
  PRAED: {
    de: 'liegt die Betonung auf dem Zustand.',
    en: 'puts the emphasis on the state.',
  },
  SUBJ: {
    de: 'ist der Satz neutral.',
    en: 'the sentence is neutral.',
  },
};

/**
 * Builds the note shown for a correct-but-not-canonical answer.
 *
 * `frontedSurface` is the constituent the learner put first and `frontedRole`
 * its role. A marked order additionally says so, because "grammatical but you
 * would rarely say it" is the distinction the whole app exists to draw.
 */
export function explainAlternative(
  frontedSurface: string,
  frontedRole: string,
  marked: boolean,
): AlternativeNote {
  const effect = FRONTED_EFFECT[frontedRole];

  if (!effect) {
    return marked
      ? {
          de: 'Möglich, aber ungewöhnlich.',
          en: 'Possible, but unusual.',
          emphasis: frontedSurface,
        }
      : {
          de: 'Auch richtig.',
          en: 'Also correct.',
          emphasis: frontedSurface,
        };
  }

  if (marked) {
    return {
      de: `Möglich, aber ungewöhnlich: mit „${frontedSurface}" im Vorfeld ${effect.de}`,
      en: `Possible but unusual — fronting "${frontedSurface}" ${effect.en}`,
      emphasis: frontedSurface,
    };
  }

  return {
    de: `Auch richtig. Mit „${frontedSurface}" im Vorfeld ${effect.de}`,
    en: `Also correct. Fronting "${frontedSurface}" ${effect.en}`,
    emphasis: frontedSurface,
  };
}
