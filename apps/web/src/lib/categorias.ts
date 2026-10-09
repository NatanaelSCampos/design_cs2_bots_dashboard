/**
 * Categoria temática de cada recorde.
 *
 * É o selo que aparece no canto do card e, no hero, a lista das quatro famílias
 * de vergonha. Serve para o leitor entender "que tipo de bagre é esse" antes de
 * ler o número.
 *
 * O mapa é explícito, e não derivado da métrica, porque a graça é editorial:
 * "menor abates por round" é estratégia alternativa, não decisão questionável,
 * e só quem escreveu a piada sabe disso.
 *
 * Recorde sem categoria cai em `null` e o card simplesmente não mostra selo —
 * melhor que inventar um rótulo errado.
 */

export interface Categoria {
  rotulo: string;
  /** Caminho SVG num viewBox 0 0 24 24. */
  icone: string;
}

/** Ícones simples e fechados: formas que leem em 16px. */
const LAPIDE =
  "M12 2a7 7 0 0 0-7 7v10h14V9a7 7 0 0 0-7-7Zm-1 5h2v3h3v2h-3v5h-2v-5H8v-2h3V7Z" +
  "M3 19h18v3H3Z";
const GRANADA =
  "M14 2h5v2h-3v2.2l1.6 1.2-1.2 1.6L15 7.8V9h-1.4A7 7 0 1 1 10 7.3V5H8V3h6V2Z" +
  "M11 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z";
const MIRA =
  "M12 2v4M12 18v4M2 12h4M18 12h4" +
  "M12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" +
  "M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z";
const CONE = "M11 3h2l5 15H6L11 3Zm-7 16h16v2H4Z" + "M9.3 9h5.4l.7 2H8.6l.7-2Z";
const TROFEU =
  "M6 3h12v2h3v3a4 4 0 0 1-4 4h-.6A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 7.6 12H7a4 4 0 0 1-4-4V5h3V3Z" +
  "M5 7v1a2 2 0 0 0 2 2V7H5Zm14 0h-2v3a2 2 0 0 0 2-2V7Z";
const ESCUDO = "M12 2l8 3v6c0 5-3.4 9.1-8 11-4.6-1.9-8-6-8-11V5l8-3Z";
const BANDEJA =
  "M12 3a2 2 0 0 1 2 2v.3A7 7 0 0 1 19 12H5a7 7 0 0 1 5-6.7V5a2 2 0 0 1 2-2Z" +
  "M3 14h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2Z";

export const CATEGORIAS = {
  inesqueciveis: { rotulo: "Jogada inesquecível", icone: LAPIDE },
  questionaveis: { rotulo: "Decisão questionável", icone: GRANADA },
  team_kill: { rotulo: "Team kill de ouro", icone: MIRA },
  alternativas: { rotulo: "Estratégia alternativa", icone: CONE },
  carregou: { rotulo: "Carregou o time", icone: TROFEU },
  cirurgica: { rotulo: "Mira cirúrgica", icone: MIRA },
  sobrevivencia: { rotulo: "Sobrevivência pura", icone: ESCUDO },
  equipe: { rotulo: "Trabalho de equipe", icone: BANDEJA },
} as const satisfies Record<string, Categoria>;

export type ChaveCategoria = keyof typeof CATEGORIAS;

/** As quatro famílias de vergonha, na ordem em que o hero as lista. */
export const FAMILIAS_VERGONHA: readonly ChaveCategoria[] = [
  "inesqueciveis",
  "questionaveis",
  "team_kill",
  "alternativas",
];

const POR_RECORDE: Readonly<Record<string, ChaveCategoria>> = {
  // Vergonha
  "passeio-no-mapa": "alternativas",
  "entregou-o-corpo": "inesqueciveis",
  "abriu-o-round": "inesqueciveis",
  "inimigo-interno": "team_kill",
  "cegou-os-proprios": "questionaveis",
  chuveirinho: "questionaveis",
  pacifista: "alternativas",
  "vendeu-barato": "inesqueciveis",
  "so-assistencia": "alternativas",
  // Fama
  "carregou-sozinho": "carregou",
  colheita: "cirurgica",
  "economia-de-bala": "cirurgica",
  "vendeu-caro": "carregou",
  "sobreviveu-a-tudo": "sobrevivencia",
  "nunca-abriu": "sobrevivencia",
  "garcom-de-ouro": "equipe",
};

export function categoriaDe(recordId: string): Categoria | null {
  const chave = POR_RECORDE[recordId];
  return chave ? CATEGORIAS[chave] : null;
}
