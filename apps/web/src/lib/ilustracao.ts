/**
 * Encaixe das ilustrações de verdade.
 *
 * Arte raster rica — a pegada das referências — não dá para autorar em caminho
 * SVG. Então este módulo é o **encaixe**: se existe um arquivo para a chave, ele
 * é usado; se não existe, cai na arte gerada em código, que continua sendo a
 * rede de segurança.
 *
 * Arquivos vão em `apps/web/src/assets/ilustracoes/<chave>.<ext>`, onde `chave`
 * é o `record_id` do Hall ou o `award_id` do Jornal. `import.meta.glob` resolve
 * em tempo de build: nenhum `fs` em runtime, e ilustração ausente não vira 404.
 */

const ARQUIVOS = import.meta.glob<string>("../assets/ilustracoes/*.{webp,png,jpg,jpeg,avif}", {
  eager: true,
  query: "?url",
  import: "default",
});

/** `../assets/ilustracoes/passeio-no-mapa.webp` → `passeio-no-mapa` */
function chaveDoCaminho(caminho: string): string {
  const nome = caminho.split("/").pop() ?? "";
  return nome.replace(/\.(webp|png|jpe?g|avif)$/i, "");
}

const POR_CHAVE: ReadonlyMap<string, string> = new Map(
  Object.entries(ARQUIVOS).map(([caminho, url]) => [chaveDoCaminho(caminho), url]),
);

/** URL da ilustração, ou null quando ainda não existe arquivo para a chave. */
export function ilustracaoDe(chave: string): string | null {
  return POR_CHAVE.get(chave) ?? null;
}

/** Quais chaves já têm arte, para relatório e para a página de status. */
export function chavesComIlustracao(): string[] {
  return [...POR_CHAVE.keys()].sort();
}
