/**
 * Selos de cada card.
 *
 * Vêm do pacote entregue: um ou dois PNG por recorde, já com a textura de
 * carimbo e transparência. Substituem os carimbos que eu havia desenhado em
 * CSS, que ficavam lavados e com a borda errada.
 *
 * Arquivo: `selos/<record_id>--<nome>.webp`. O `import.meta.glob` resolve em
 * tempo de build, então selo ausente não vira 404 nem exige checar o disco.
 */

const ARQUIVOS = import.meta.glob<string>("../assets/selos/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

export interface Selo {
  /** Parte depois do `--`: `mvp-do-bagre`, `vergonha-certificada`. */
  nome: string;
  url: string;
}

const POR_RECORDE = new Map<string, Selo[]>();

for (const [caminho, url] of Object.entries(ARQUIVOS)) {
  const arquivo = (caminho.split("/").pop() ?? "").replace(/\.webp$/, "");
  const separador = arquivo.indexOf("--");
  if (separador === -1) continue;
  const chave = arquivo.slice(0, separador);
  const nome = arquivo.slice(separador + 2);
  const lista = POR_RECORDE.get(chave) ?? [];
  lista.push({ nome, url });
  POR_RECORDE.set(chave, lista);
}

/**
 * Selo que fica sobre a miniatura, no canto superior esquerdo.
 *
 * É sempre o `mvp-do-bagre` quando existe — ele é o destaque da referência e só
 * um card o tem. Nenhum outro selo ocupa essa posição, para não haver dois
 * carimbos disputando o mesmo canto.
 */
export function seloDeDestaque(recordId: string): Selo | null {
  return POR_RECORDE.get(recordId)?.find((s) => s.nome === "mvp-do-bagre") ?? null;
}

/**
 * Selo do canto superior direito do card: a "certificação" da jogada.
 *
 * É o primeiro selo que não seja o de destaque. Quando o pacote traz dois
 * (`vendeu-caro` tem `vendeu-caro` e `serviu-a-vida`), usamos o que repete o
 * `record_id`, que é o nominal; o outro fica de reserva.
 */
export function seloDoCard(recordId: string): Selo | null {
  const lista = POR_RECORDE.get(recordId);
  if (!lista) return null;
  const candidatos = lista.filter((s) => s.nome !== "mvp-do-bagre");
  return candidatos.find((s) => s.nome === recordId) ?? candidatos[0] ?? null;
}

/** Quais recordes já têm selo, para o relatório e para teste. */
export function recordesComSelo(): string[] {
  return [...POR_RECORDE.keys()].sort();
}
