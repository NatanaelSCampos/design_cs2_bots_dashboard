import type { MatchListItem } from "@lobby/contracts";

/**
 * Agregações do painel da home.
 *
 * Funções puras, sem DOM e sem rede, por dois motivos concretos:
 *
 *  - o mesmo cálculo roda no servidor (render inicial) e no navegador (quando o
 *    leitor troca um filtro). Duas implementações divergiriam, e o painel
 *    passaria a discordar de si mesmo;
 *  - dá para testar cada recorte contra números conhecidos, em vez de conferir
 *    a olho num gráfico.
 *
 * Nenhum número é inventado aqui: tudo sai dos campos que o Worker já entrega em
 * `MatchListItem`. O que esta camada faz é contar e agrupar.
 */

/** Mesmo fuso de `format.ts`. Agrupar por UTC jogaria partida das 21h para o dia seguinte. */
const FUSO = "America/Sao_Paulo";

/** `YYYY-MM-DD` no fuso de Brasília, não no relógio de quem serve a página. */
export function diaLocal(iso: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return partes;
}

export type ChaveFormato = "5v5" | "wingman" | "outro";

/**
 * Mesmo limiar de `formato()` em `format.ts`: até 4 jogadores é Wingman, 8 ou
 * mais é 5v5. O meio não é classificado — partida de 5 a 7 jogadores existe
 * (alguém saiu) e chamá-la de 5v5 ou de Wingman seria afirmar o que não se sabe.
 */
export function chaveFormato(playerCount: number): ChaveFormato {
  if (playerCount > 0 && playerCount <= 4) return "wingman";
  if (playerCount >= 8) return "5v5";
  return "outro";
}

export type ChaveLobby = "com_amigos" | "sozinho";

/** Dois membros ou mais é "com amigos". É o mesmo eixo que os prêmios usam. */
export function chaveLobby(memberCount: number): ChaveLobby {
  return memberCount >= 2 ? "com_amigos" : "sozinho";
}

export interface FiltrosPainel {
  formato: ChaveFormato | "todos";
  lobby: ChaveLobby | "todos";
  mapa: string | "todos";
}

export const FILTROS_VAZIOS: FiltrosPainel = {
  formato: "todos",
  lobby: "todos",
  mapa: "todos",
};

export function filtrar(
  partidas: readonly MatchListItem[],
  filtros: FiltrosPainel,
): MatchListItem[] {
  return partidas.filter((p) => {
    if (filtros.formato !== "todos" && chaveFormato(p.player_count) !== filtros.formato) {
      return false;
    }
    if (filtros.lobby !== "todos" && chaveLobby(p.member_count) !== filtros.lobby) return false;
    if (filtros.mapa !== "todos" && p.map_name !== filtros.mapa) return false;
    return true;
  });
}

export interface Fatia {
  chave: string;
  valor: number;
}

export interface PontoDia {
  dia: string;
  partidas: number;
  rounds: number;
}

export interface ResumoPainel {
  partidas: number;
  rounds: number;
  comAmigos: number;
  mapasDistintos: number;
  /** Mediana de rounds. Mais honesta que média quando há Wingman no meio. */
  roundsMedianos: number;
  /** Um ponto por dia do intervalo, incluindo os dias sem partida. */
  porDia: PontoDia[];
  /** Ordenado do mais jogado para o menos. */
  porMapa: Fatia[];
  /** Sempre nesta ordem: 1, 2, 3+ membros. Chaves ausentes entram com zero. */
  porMembros: Fatia[];
}

function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const ordenado = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenado.length / 2);
  return ordenado.length % 2 === 1
    ? ordenado[meio]!
    : (ordenado[meio - 1]! + ordenado[meio]!) / 2;
}

/**
 * Preenche os dias sem partida entre o primeiro e o último.
 *
 * Sem isso, uma pausa de cinco dias apareceria como duas colunas vizinhas e o
 * gráfico mentiria sobre o ritmo: o eixo do tempo tem que ser contínuo.
 */
function diasContinuos(porDia: Map<string, PontoDia>): PontoDia[] {
  const chaves = [...porDia.keys()].sort();
  const primeira = chaves[0];
  const ultima = chaves[chaves.length - 1];
  if (primeira === undefined || ultima === undefined) return [];

  const saida: PontoDia[] = [];
  // Meio-dia UTC evita que o passo de 24 h caia no limite do horário de verão.
  const cursor = new Date(`${primeira}T12:00:00.000Z`);
  const fim = new Date(`${ultima}T12:00:00.000Z`);

  // Teto de segurança: um intervalo absurdo não pode virar laço infinito.
  for (let i = 0; cursor <= fim && i < 400; i += 1) {
    const dia = cursor.toISOString().slice(0, 10);
    saida.push(porDia.get(dia) ?? { dia, partidas: 0, rounds: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return saida;
}

export function agregar(partidas: readonly MatchListItem[]): ResumoPainel {
  const porDia = new Map<string, PontoDia>();
  const porMapa = new Map<string, number>();
  const porMembros = new Map<string, number>();
  let rounds = 0;
  let comAmigos = 0;

  for (const p of partidas) {
    rounds += p.rounds_played;
    if (chaveLobby(p.member_count) === "com_amigos") comAmigos += 1;

    porMapa.set(p.map_name, (porMapa.get(p.map_name) ?? 0) + 1);

    const faixa = p.member_count >= 3 ? "3+" : String(p.member_count);
    porMembros.set(faixa, (porMembros.get(faixa) ?? 0) + 1);

    // Partida sem horário não entra na série temporal: colocá-la em qualquer
    // dia seria inventar data. Ela continua contada em todo o resto.
    if (p.started_at) {
      const dia = diaLocal(p.started_at);
      const atual = porDia.get(dia) ?? { dia, partidas: 0, rounds: 0 };
      atual.partidas += 1;
      atual.rounds += p.rounds_played;
      porDia.set(dia, atual);
    }
  }

  return {
    partidas: partidas.length,
    rounds,
    comAmigos,
    mapasDistintos: porMapa.size,
    roundsMedianos: mediana(partidas.map((p) => p.rounds_played)),
    porDia: diasContinuos(porDia),
    porMapa: [...porMapa.entries()]
      .map(([chave, valor]) => ({ chave, valor }))
      .sort((a, b) => b.valor - a.valor || a.chave.localeCompare(b.chave)),
    porMembros: ["1", "2", "3+"].map((chave) => ({
      chave,
      valor: porMembros.get(chave) ?? 0,
    })),
  };
}

/** Mapas presentes, para montar o seletor sem opção morta. */
export function mapasDisponiveis(partidas: readonly MatchListItem[]): string[] {
  return [...new Set(partidas.map((p) => p.map_name))].sort();
}
