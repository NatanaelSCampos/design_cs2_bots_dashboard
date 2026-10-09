/**
 * O subconjunto da API Canvas 2D que o card usa.
 *
 * Existe para o desenho ser escrito **uma vez** e rodar nos dois hosts:
 *
 *  - `@napi-rs/canvas` no coletor, que gera o PNG anexado ao Discord;
 *  - o canvas do navegador, que gera o PNG que a pessoa compartilha.
 *
 * Antes desta camada havia um único renderizador, só no coletor, com as cores
 * repetidas como literais e fontes de sistema — então o card do Discord e o
 * site já não eram o mesmo produto, apesar do comentário dizer que eram.
 *
 * Tipar o subconjunto em vez de usar `CanvasRenderingContext2D` é deliberado:
 * assim o compilador recusa qualquer recurso que só exista em um dos dois.
 */

export interface GradienteLinear {
  addColorStop(offset: number, cor: string): void;
}

export interface Ctx2D {
  fillStyle: string | GradienteLinear;
  strokeStyle: string;
  lineWidth: number;
  lineCap: "butt" | "round" | "square";
  lineJoin: "round" | "bevel" | "miter";
  font: string;
  textAlign: "left" | "right" | "center" | "start" | "end";
  textBaseline: "top" | "middle" | "bottom" | "alphabetic" | "hanging" | "ideographic";
  globalAlpha: number;

  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;

  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  arc(x: number, y: number, r: number, inicio: number, fim: number): void;
  rect(x: number, y: number, w: number, h: number): void;

  fill(caminho?: unknown): void;
  stroke(caminho?: unknown): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(texto: string, x: number, y: number): void;
  /**
   * Desenha uma imagem já carregada. O tipo é `unknown` porque o objeto é
   * diferente em cada host — `Image` do `@napi-rs/canvas` no coletor,
   * `HTMLImageElement` no navegador — e o card não precisa saber qual é.
   */
  drawImage(imagem: unknown, x: number, y: number, w: number, h: number): void;
  clip(): void;
  measureText(texto: string): { width: number };
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): GradienteLinear;
}

/**
 * Fábrica de `Path2D`, que cada host fornece.
 *
 * `Path2D` aceita string `d` de SVG nos dois (verificado em 2026-10-07), e é o
 * que permite autorar as ilustrações como caminho em vez de código de desenho.
 */
export type FabricaDeCaminho = (d: string) => unknown;

/** Retângulo com cantos arredondados, sem depender de `roundRect`. */
export function caminhoArredondado(
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const raio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.lineTo(x + w - raio, y);
  ctx.arc(x + w - raio, y + raio, raio, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - raio);
  ctx.arc(x + w - raio, y + h - raio, raio, 0, Math.PI / 2);
  ctx.lineTo(x + raio, y + h);
  ctx.arc(x + raio, y + h - raio, raio, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + raio);
  ctx.arc(x + raio, y + raio, raio, Math.PI, (3 * Math.PI) / 2);
  ctx.closePath();
}

/**
 * Quebra texto em linhas que cabem na largura, medindo de verdade.
 *
 * Medir em vez de contar caracteres importa: "MMMM" e "iiii" têm o mesmo número
 * de letras e larguras muito diferentes. Palavra que não cabe sozinha fica na
 * própria linha e transborda — é melhor que cortar no meio.
 */
export function quebrarLinhas(
  ctx: Ctx2D,
  texto: string,
  larguraMax: number,
  maxLinhas = 3,
): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";

  for (const palavra of palavras) {
    const tentativa = atual === "" ? palavra : `${atual} ${palavra}`;
    if (ctx.measureText(tentativa).width <= larguraMax || atual === "") {
      atual = tentativa;
    } else {
      linhas.push(atual);
      atual = palavra;
      if (linhas.length === maxLinhas) break;
    }
  }
  if (atual !== "" && linhas.length < maxLinhas) linhas.push(atual);

  // Reticências na última linha quando sobrou texto.
  if (linhas.length === maxLinhas) {
    const consumido = linhas.join(" ").length;
    if (consumido < texto.length - 1) {
      const ultima = linhas[maxLinhas - 1]!;
      linhas[maxLinhas - 1] = `${ultima.replace(/[\s,.;:]+$/, "")}…`;
    }
  }
  return linhas;
}
