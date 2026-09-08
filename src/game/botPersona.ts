export interface BotPersona {
  name: string;
  emoji: string;
}

const PERSONAS: { max: number; name: string; emoji: string }[] = [
  { max: 15, name: 'Wackel-Bot', emoji: '🤪' },
  { max: 35, name: 'Rookie', emoji: '🙂' },
  { max: 55, name: 'Taktiker', emoji: '🤖' },
  { max: 75, name: 'Stratege', emoji: '🧠' },
  { max: 92, name: 'Meister', emoji: '😤' },
  { max: 101, name: 'Nemesis', emoji: '👹' },
];

/** A named "personality" for the bot, derived from its difficulty percent, so it reads
 * like an opponent rather than a progress bar. */
export function botPersona(difficulty: number): BotPersona {
  const persona = PERSONAS.find((p) => difficulty <= p.max) ?? PERSONAS[PERSONAS.length - 1];
  return { name: persona.name, emoji: persona.emoji };
}
