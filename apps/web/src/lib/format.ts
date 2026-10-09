/**
 * Formatacao para leitura humana. Nenhum calculo aqui: todo numero exibido vem
 * pronto do Worker, para o site nunca discordar do Jornal ou do card.
 */
const FUSO = "America/Sao_Paulo";

/**
 * Dia da semana pelo fuso de Brasilia, nao pelo relogio de quem serve a pagina:
 * o servidor pode estar em UTC e trocar o dia.
 */
function diaDaSemana(d: Date): string {
  const curto = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "short" }).format(d);
  return curto.replace(/\.$/, "");
}

export function dataHora(iso: string | null): string {
  if (!iso) return "sem horario";
  const d = new Date(iso);
  const quando = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${diaDaSemana(d)} ${quando}`;
}

export function dataCurta(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}

export function numero(valor: number, casas = 1): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function porcento(valor: number, casas = 1): string {
  return `${numero(valor * 100, casas)}%`;
}

/** Onde a partida foi jogada. Slug no banco, nome proprio na tela. */
export function plataforma(valor: string): string {
  const mapa: Record<string, string> = {
    valve: "Premier / MM",
    faceit: "FACEIT",
    local: "Servidor proprio",
    other: "Outra",
  };
  return mapa[valor] ?? valor;
}

/** Como a demo chegou ate aqui. Procedencia, nao identidade. */
export function procedencia(valor: string): string {
  const mapa: Record<string, string> = {
    steam_gcpd: "Steam (GCPD)",
    steam_auth_code: "Steam (auth code)",
    manual: "importacao manual",
    faceit_api: "API do FACEIT",
    other: "outra",
  };
  return mapa[valor] ?? valor;
}

export function formato(playerCount: number): string {
  if (playerCount > 0 && playerCount <= 4) return "Wingman 2v2";
  if (playerCount >= 8) return "Competitivo 5v5";
  return `${playerCount} jogadores`;
}

export function rotuloBalde(bucket: string): string {
  const mapa: Record<string, string> = {
    solo: "sozinho",
    com_amigos: "com amigos",
    wingman: "Wingman 2v2",
    competitivo: "Competitivo 5v5",
    outro: "outro formato",
    vitoria: "vitorias",
    derrota: "derrotas",
    empate: "empates",
    total: "carreira",
  };
  return mapa[bucket] ?? bucket;
}

export function rotuloEixo(axis: string): string {
  const mapa: Record<string, string> = {
    lobby: "com amigos / sozinho",
    formato: "Wingman / 5v5",
    resultado: "vitorias / derrotas",
  };
  return mapa[axis] ?? axis;
}

export function rotuloMetrica(stat: string): string {
  const mapa: Record<string, string> = {
    adr: "dano por round",
    kd: "abates por morte",
    first_death_rate: "primeira morte do time",
    team_damage_per_round: "dano em aliados por round",
    friendly_flash_per_round: "flash amiga por round",
  };
  return mapa[stat] ?? stat;
}

/** Nome curto do jogador. Terceiros nunca tem apelido: mostram o ref anonimo. */
export function nomeDe(ref: string, displayName: string | null): string {
  if (displayName) return displayName;
  return ref.startsWith("anon:") ? `anonimo ${ref.slice(5, 11)}` : ref;
}

/**
 * Parametro de rota do Astro, decodificado com seguranca.
 *
 * O Astro entrega o segmento como ele esta na URL. Como os identificadores
 * deste projeto sao [a-z0-9:._-] e nunca contem "%", a presenca do "%" so pode
 * significar que o valor chegou percent-encoded — e decodificar duas vezes
 * nunca acontece.
 */
export function paramDecodificado(bruto: string | undefined): string {
  const valor = bruto ?? "";
  if (!valor.includes("%")) return valor;
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}

/** Valor de um recorde do Hall, formatado conforme a unidade que ele declara. */
/**
 * Número do Hall, separado em valor e unidade.
 *
 * Existe porque a versão anterior devolvia número pelado para tudo que não era
 * percentual: a tela mostrava "29,86" e o leitor não tinha como saber se eram
 * pontos de dano, mortes ou segundos. `unit` diz a FORMA ("por round"), e
 * `stat_unit` diz o QUÊ ("dano").
 *
 * Devolve as duas partes separadas de propósito, para a tela compor o número
 * grande com a unidade pequena ao lado em vez de uma string só.
 */
export interface ValorComUnidade {
  valor: string;
  unidade: string;
}

export function valorHall(
  valor: number,
  unidade: string,
  statUnit?: string,
): ValorComUnidade {
  if (unidade === "percentual") {
    return { valor: numero(valor * 100, 1), unidade: statUnit ? `% ${statUnit}` : "%" };
  }
  if (unidade === "razao") {
    return { valor: numero(valor, 2), unidade: statUnit ?? "×" };
  }
  // por_round: casas decimais pelo tamanho do número. 222,54 dano/round não
  // precisa de centésimo; 0,31 mortes/round precisa.
  const casas = Math.abs(valor) >= 10 ? 1 : 2;
  return { valor: numero(valor, casas), unidade: `${statUnit ?? ""}/round`.trim() };
}
