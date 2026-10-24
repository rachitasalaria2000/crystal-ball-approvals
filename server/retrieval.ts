import { policy } from "../data/policy";
const terms = (text: string) =>
  new Set(text.toLowerCase().match(/[a-z]{3,}/g) ?? []);
export function retrieve(question: string) {
  const query = terms(question);
  return policy
    .map((chunk) => ({
      ...chunk,
      score: [...query].filter((t) =>
        terms(chunk.title + " " + chunk.text).has(t),
      ).length,
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...chunk }) => chunk);
}
