import { z } from "zod";
import { IsoDateTime, PlayerRef, SemVer, Slug } from "./primitives.ts";

/**
 * Contratos de carreira: estatísticas de um membro ATRAVÉS de várias partidas.
 *
 * Diferente das métricas por partida, que saem dos eventos no R2, estes números
 * são derivados do que já está no D1. Nada aqui é persistido: o relatório é
 * calculado na leitura, então nunca fica dessincronizado do banco e recalcula
 * sozinho quando o roster cresce ou uma partida é reprocessada.
 */

/**
 * Eixos de contraste. Cada partida cai em exatamente um balde por eixo.
 *
 * - `lobby`: quantos membros da liga jogaram. É o eixo "com os amigos / sem os
 *   amigos". Com um único membro no roster, o balde `com_amigos` fica
 *   permanentemente vazio — não por bug, mas porque terceiros são anonimizados
 *   por partida e não dá para saber que são sempre as mesmas pessoas.
 * - `formato`: Wingman (2v2) contra competitivo (5v5).
 * - `resultado`: vitória contra derrota.
 */
export const ContextAxis = z.enum(["lobby", "formato", "resultado"]);
export type ContextAxis = z.infer<typeof ContextAxis>;

export const LobbyBucket = z.enum(["solo", "com_amigos"]);
export const FormatBucket = z.enum(["wingman", "competitivo", "outro"]);
export const ResultBucket = z.enum(["vitoria", "derrota", "empate"]);

/** Uma partida, reduzida ao que a carreira precisa. */
export const CareerMatch = z.strictObject({
  match_id: z.string().min(1),
  map_name: z.string().min(1),
  started_at: IsoDateTime.nullable(),
  /** Rounds que ESTE jogador disputou; é o denominador do ADR. */
  rounds_played: z.number().int().nonnegative(),
  lobby: LobbyBucket,
  formato: FormatBucket,
  resultado: ResultBucket,
  kills: z.number().int().nonnegative(),
  deaths: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative(),
  damage_dealt: z.number().int().nonnegative(),
  first_deaths: z.number().int().nonnegative(),
  /** Dano de vida causado em companheiros de time. */
  team_damage: z.number().nonnegative(),
  /** Segundos de cegueira causados em companheiros de time. */
  friendly_flash_seconds: z.number().nonnegative(),
});
export type CareerMatch = z.infer<typeof CareerMatch>;

/**
 * Números agregados de um conjunto de partidas.
 *
 * Todo valor derivado vem acompanhado dos brutos que o produziram, para que
 * qualquer número exibido seja conferível sem refazer a conta.
 */
export const BucketStats = z.strictObject({
  axis: ContextAxis.nullable(),
  bucket: z.string().min(1),
  matches: z.number().int().nonnegative(),
  rounds: z.number().int().nonnegative(),
  kills: z.number().int().nonnegative(),
  deaths: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative(),
  damage_dealt: z.number().int().nonnegative(),
  first_deaths: z.number().int().nonnegative(),
  team_damage: z.number().nonnegative(),
  friendly_flash_seconds: z.number().nonnegative(),
  /** Dano por round. 0 quando não houve round. */
  adr: z.number().finite().nonnegative(),
  /** Abates por morte. Igual a kills quando não morreu nenhuma vez. */
  kd: z.number().finite().nonnegative(),
  /** Proporção de rounds em que foi a primeira morte do time. */
  first_death_rate: z.number().finite().nonnegative(),
  /** Dano em companheiros por round. */
  team_damage_per_round: z.number().finite().nonnegative(),
  /** Segundos de cegueira em companheiros por round. */
  friendly_flash_per_round: z.number().finite().nonnegative(),
  /** false => balde pequeno demais para sustentar comparação. */
  sample_ok: z.boolean(),
});
export type BucketStats = z.infer<typeof BucketStats>;

/**
 * Prêmio de CONTRASTE PESSOAL: a mesma pessoa em dois contextos.
 *
 * Não precisa de concorrente — é o jogador contra ele mesmo. É por isso que
 * funciona com um único membro no roster, ao contrário dos prêmios
 * comparativos entre jogadores (ver packages/metrics/src/first-death.ts).
 */
export const ContrastAward = z.strictObject({
  award_id: Slug,
  /** Título curto e humorístico, em PT-BR. */
  title: z.string().min(1).max(64),
  /** Frase de efeito. Humor sim, número inventado não. */
  verdict: z.string().min(1).max(280),
  axis: ContextAxis,
  stat: z.enum([
    "adr",
    "first_death_rate",
    "kd",
    "team_damage_per_round",
    "friendly_flash_per_round",
  ]),
  /** Balde em que a estatística ficou mais alta, e o outro. */
  high: BucketStats,
  low: BucketStats,
  /** high/low. Sempre >= 1. */
  ratio: z.number().finite().nonnegative(),
  /** Regra literal aplicada, para a página de critérios não reimplementá-la. */
  criterion: z.string().min(1).max(400),
  formula_version: SemVer,
});
export type ContrastAward = z.infer<typeof ContrastAward>;

export const PlayerReport = z.strictObject({
  player_ref: PlayerRef,
  display_name: z.string().min(1).max(64).nullable(),
  totals: BucketStats,
  buckets: z.array(BucketStats),
  awards: z.array(ContrastAward),
  /**
   * Por que um contraste NÃO virou prêmio, em português. Existe para que a
   * ausência de prêmio seja explicada em vez de parecer bug.
   */
  notes: z.array(z.string().min(1).max(280)),
});
export type PlayerReport = z.infer<typeof PlayerReport>;

export const AwardsReport = z.strictObject({
  league_id: Slug,
  generated_at: IsoDateTime,
  formula_version: SemVer,
  matches_considered: z.number().int().nonnegative(),
  players: z.array(PlayerReport),
});
export type AwardsReport = z.infer<typeof AwardsReport>;
