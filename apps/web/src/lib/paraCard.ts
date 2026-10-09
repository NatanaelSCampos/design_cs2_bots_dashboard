import type { DadosDoCard } from "@lobby/card";
import type { BucketStats, ContrastAward, HallEntry } from "@lobby/contracts";
import { iniciais, nomeDeMapa } from "./arte.ts";
import { dataCurta, nomeDe, numero, rotuloBalde, valorHall } from "./format.ts";

/**
 * Converte o que o Worker entrega no que o card desenha.
 *
 * Funções puras e testáveis, separadas do desenho de propósito: o card não
 * calcula nada, e esta camada não desenha nada. Se um número não vem do Worker,
 * ele não chega ao card.
 */

function edicaoDeHoje(agora = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  })
    .format(agora)
    .replace(/\.,/, ",");
}

/**
 * Recorde do Hall vira card de um lado só: não há comparação a fazer.
 *
 * `absoluto` marca que a atuação também é o extremo de todos os tempos, e não
 * só do recorte recente. Chega até aqui porque o card baixado precisa dizer o
 * mesmo que a tela — se o marcador existisse só no HTML, a imagem que vai para
 * o WhatsApp contaria uma história mais fraca que a página.
 */
export function cardDeRecorde(e: HallEntry, agora?: Date, absoluto = false): DadosDoCard {
  const v = valorHall(e.value, e.unit, e.stat_unit);
  const nome = nomeDe(e.player_ref, e.display_name);
  const bruto = Number.isInteger(e.numerator) ? String(e.numerator) : numero(e.numerator);

  return {
    chave: e.record_id,
    manchete: e.title,
    frase: e.blurb,
    jogador: nome,
    iniciais: iniciais(nome),
    rodape: `${nomeDeMapa(e.map_name)} · ${dataCurta(e.started_at)} · ${e.rounds}r`,
    edicao: edicaoDeHoje(agora),
    tom: e.kind,
    // Sem selo: o número já é o protagonista na caixa abaixo, e repeti-lo no
    // canto da ilustração seria o mesmo dado duas vezes.
    ...(absoluto ? { faixa: "RECORDE ABSOLUTO" } : {}),
    lados: [
      {
        rotulo: e.stat_label.toUpperCase(),
        valor: v.valor,
        unidade: v.unidade,
        bruto: `${bruto} em ${e.denominator} rounds`,
        proporcao: 1,
      },
    ],
  };
}

/** Valor e unidade de uma métrica de contraste, no mesmo formato do Hall. */
export function valorDeContraste(
  stat: ContrastAward["stat"],
  lado: BucketStats,
): { valor: string; unidade: string } {
  const bruto = lado[stat];
  if (stat === "first_death_rate") {
    return { valor: numero(bruto * 100, 1), unidade: "% dos rounds" };
  }
  if (stat === "adr") return { valor: numero(bruto), unidade: "dano/round" };
  if (stat === "team_damage_per_round") {
    return { valor: numero(bruto, 2), unidade: "dano aliado/round" };
  }
  if (stat === "friendly_flash_per_round") {
    return { valor: numero(bruto, 2), unidade: "s de flash/round" };
  }
  return { valor: numero(bruto, 2), unidade: "abates/morte" };
}

export function brutoDeContraste(stat: ContrastAward["stat"], lado: BucketStats): string {
  if (stat === "adr") return `${lado.damage_dealt} de dano em ${lado.rounds} rounds`;
  if (stat === "first_death_rate") return `${lado.first_deaths} em ${lado.rounds} rounds`;
  if (stat === "team_damage_per_round") {
    return `${numero(lado.team_damage, 0)} de dano em ${lado.rounds} rounds`;
  }
  if (stat === "friendly_flash_per_round") {
    return `${numero(lado.friendly_flash_seconds)}s em ${lado.rounds} rounds`;
  }
  return `${lado.kills}/${lado.deaths} em ${lado.rounds} rounds`;
}

/** Prêmio de contraste vira card de dois lados: a comparação É o prêmio. */
export function cardDePremio(
  a: ContrastAward,
  playerRef: string,
  displayName: string | null,
  agora?: Date,
): DadosDoCard {
  const nome = nomeDe(playerRef, displayName);
  const alto = valorDeContraste(a.stat, a.high);
  const baixo = valorDeContraste(a.stat, a.low);
  const maximo = Math.max(a.high[a.stat], a.low[a.stat]);

  return {
    chave: a.award_id,
    metrica: a.stat,
    manchete: a.title,
    frase: a.verdict,
    jogador: nome,
    iniciais: iniciais(nome),
    rodape: `${a.high.rounds} vs ${a.low.rounds} rounds`,
    edicao: edicaoDeHoje(agora),
    selo: `${numero(a.ratio, 2)}×`,
    // Contraste é sempre uma observação sobre piorar em algum contexto; o tom
    // de vergonha é o honesto. Elogio puro vive no Hall da Fama.
    tom: "vergonha",
    lados: [
      {
        rotulo: rotuloBalde(a.high.bucket).toUpperCase(),
        valor: alto.valor,
        unidade: alto.unidade,
        bruto: brutoDeContraste(a.stat, a.high),
        proporcao: maximo > 0 ? a.high[a.stat] / maximo : 0,
      },
      {
        rotulo: rotuloBalde(a.low.bucket).toUpperCase(),
        valor: baixo.valor,
        unidade: baixo.unidade,
        bruto: brutoDeContraste(a.stat, a.low),
        proporcao: maximo > 0 ? a.low[a.stat] / maximo : 0,
      },
    ],
  };
}
