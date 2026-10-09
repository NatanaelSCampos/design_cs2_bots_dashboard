/**
 * Arte ilustrativa gerada em código.
 *
 * Por que gerada, e não imagem baixada:
 *
 *  - **sem asset de terceiro.** As artes de mapa do CS2 são da Valve. Versionar
 *    isso num repositório, mesmo privado, é uma decisão que o projeto não
 *    precisa tomar;
 *  - **sem dependência nova** e sem requisição de rede: é SVG montado a partir
 *    de uma semente;
 *  - **estável.** O mesmo mapa recebe sempre a mesma arte, em qualquer máquina
 *    e em qualquer render. Se mudasse a cada visita, deixaria de servir como
 *    reconhecimento visual.
 *
 * A arte não carrega dado nenhum: é moldura. Nenhum número, proporção ou
 * ranking é codificado nela — para ninguém tentar ler valor onde não há.
 */

/**
 * Hash FNV-1a de 32 bits. Determinístico e pequeno; não é criptográfico e não
 * precisa ser — só precisa espalhar nomes parecidos (`de_nuke`, `de_mirage`)
 * em sementes diferentes.
 */
export function semente(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Gerador determinístico a partir da semente. */
function aleatorio(estado: number): () => number {
  let s = estado || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x100000000;
  };
}

/**
 * Matiz derivado do nome, dentro de uma faixa fria que convive com o ciano da
 * identidade. Sem vermelho nem verde saturado: aqueles são cores de status
 * (`warn`, `ok`) e não podem ser gastas em decoração.
 */
export function matizDe(chave: string): number {
  // 160–260: do verde-água ao azul-violeta.
  return 160 + (semente(chave) % 100);
}

export interface Marca {
  /** `viewBox` do SVG gerado. */
  viewBox: string;
  /** Caminhos do traçado, já posicionados. */
  tracos: string[];
  /** Polígono de fundo, a "planta" abstrata. */
  planta: string;
  matiz: number;
}

/**
 * Marca abstrata de um mapa: um polígono fechado com alguns corredores.
 *
 * Lembra uma planta de mapa sem ser a planta de nenhum — seria desonesto
 * sugerir que é o layout real do de_nuke.
 */
export function marcaDeMapa(nome: string): Marca {
  const rnd = aleatorio(semente(nome));
  const lados = 5 + Math.floor(rnd() * 3); // 5 a 7
  const cx = 50;
  const cy = 50;

  const pontos: Array<[number, number]> = [];
  for (let i = 0; i < lados; i += 1) {
    const ang = (i / lados) * Math.PI * 2 - Math.PI / 2;
    const raio = 24 + rnd() * 18;
    pontos.push([cx + Math.cos(ang) * raio, cy + Math.sin(ang) * raio]);
  }

  const planta =
    pontos.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
    " Z";

  // Dois ou três corredores ligando vértices não adjacentes.
  const tracos: string[] = [];
  const quantos = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < quantos; i += 1) {
    const a = pontos[Math.floor(rnd() * pontos.length)]!;
    const b = pontos[Math.floor(rnd() * pontos.length)]!;
    if (a === b) continue;
    const mx = (a[0] + b[0]) / 2 + (rnd() - 0.5) * 16;
    const my = (a[1] + b[1]) / 2 + (rnd() - 0.5) * 16;
    tracos.push(
      `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ` +
        `${b[0].toFixed(1)} ${b[1].toFixed(1)}`,
    );
  }

  return { viewBox: "0 0 100 100", planta, tracos, matiz: matizDe(nome) };
}

/** Iniciais para o avatar do jogador. Nunca mais de duas letras. */
export function iniciais(nome: string): string {
  const limpo = nome.trim();
  if (limpo === "") return "?";
  const partes = limpo.split(/[\s_-]+/).filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0]![0]! + partes[1]![0]!).toUpperCase();
  }
  return limpo.slice(0, 2).toUpperCase();
}

/**
 * Nome curto do mapa, para rótulo. `de_nuke` → `Nuke`.
 *
 * Mapas de FACEIT e partidas sem prefixo passam intactos, só capitalizados.
 */
export function nomeDeMapa(nome: string): string {
  const sem = nome.replace(/^(de|cs|ar)_/, "");
  return sem.charAt(0).toUpperCase() + sem.slice(1);
}
