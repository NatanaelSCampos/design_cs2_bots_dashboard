import { z } from "zod";
import { IsoDateTime, PlayerRef, SemVer, Slug } from "./primitives.ts";
import { IdentityKind, MatchPlayer, Platform, SourceKind } from "./match.ts";
import { AwardResult, MetricResult } from "./metrics.ts";
import { PlayerReport } from "./career.ts";

/**
 * Contratos de LEITURA — o que o site vai consumir.
 *
 * Separados dos contratos de ingestão de propósito: a forma que entra não
 * precisa ser a forma que sai. Aqui nada de `payload_sha256`, `demo_sha256`
 * nem versões de parser: são detalhes de operação, não de produto.
 *
 * Nenhuma rota expõe partida com status diferente de 'complete'.
 */

export const MatchListItem = z.strictObject({
  match_id: z.string(),
  /** Onde a partida foi jogada. Identidade, nao procedencia. */
  platform: Platform,
  platform_match_id: z.string().nullable(),
  identity_kind: IdentityKind,
  map_name: z.string(),
  started_at: IsoDateTime.nullable(),
  rounds_played: z.number().int().nonnegative(),
  team_a_score: z.number().int().nonnegative(),
  team_b_score: z.number().int().nonnegative(),
  /** Quantos membros consentidos da liga jogaram. */
  member_count: z.number().int().nonnegative(),
  /** Total de jogadores em lado válido; é o que separa Wingman de 5v5. */
  player_count: z.number().int().nonnegative(),
  formula_version: SemVer,
  /** true quando veio de fixture sintética; nunca pode virar estatística real. */
  synthetic: z.boolean(),
});
export type MatchListItem = z.infer<typeof MatchListItem>;

export const MatchList = z.strictObject({
  league_id: Slug,
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  matches: z.array(MatchListItem),
});
export type MatchList = z.infer<typeof MatchList>;

/** Por onde uma copia desta partida chegou. */
export const MatchSourceInfo = z.strictObject({
  source_kind: SourceKind,
  discovered_by: z.string().nullable(),
  source_ref: z.string().nullable(),
  demo_sha256: z.string(),
  first_seen_at: IsoDateTime,
});
export type MatchSourceInfo = z.infer<typeof MatchSourceInfo>;

export const MatchDetail = z.strictObject({
  match: MatchListItem,
  /** Todos os caminhos por onde esta partida chegou. */
  sources: z.array(MatchSourceInfo),
  /** Chave do objeto de eventos no R2. Serve para auditar, não para o navegador. */
  events_key: z.string().nullable(),
  events_bytes: z.number().int().nonnegative().nullable(),
  players: z.array(MatchPlayer),
  /** Somente os resultados da fórmula que a partida usa hoje. */
  metrics: z.array(MetricResult),
  awards: z.array(AwardResult),
});
export type MatchDetail = z.infer<typeof MatchDetail>;

export const PlayerProfile = z.strictObject({
  report: PlayerReport,
  /** Histórico do jogador, da mais recente para a mais antiga. */
  matches: z.array(MatchListItem),
});
export type PlayerProfile = z.infer<typeof PlayerProfile>;

export const NotFoundResponse = z.strictObject({
  error: z.literal("nao_encontrado"),
  detail: z.string(),
});

export const PlayerRefParam = PlayerRef;

/**
 * Resposta de `GET /v1/match-identity?platform=&platform_match_id=`.
 *
 * Pergunta "existe partida com esta identidade?", que e diferente de
 * "existe partida com este match_id": `match_id` e chave surrogate e nas
 * partidas anteriores a migration 0002 nao deriva da identidade. O watcher usa
 * esta rota para decidir se vale abrir a demo.
 */
export const IdentityLookup = z.strictObject({
  match_id: z.string().min(3).max(128),
  status: z.enum(["pending", "complete"]),
});
export type IdentityLookup = z.infer<typeof IdentityLookup>;
