import { z } from "zod";
import { IsoDateTime, SemVer, Sha256Hex, Slug, PlayerRef, TeamSide } from "./primitives.ts";

/**
 * ONDE a partida foi jogada. Define a identidade: duas demos da mesma partida
 * tem a mesma plataforma e o mesmo `platform_match_id`, independentemente de
 * como cada uma chegou ate aqui.
 */
export const Platform = z.enum(["valve", "faceit", "local", "other"]);
export type Platform = z.infer<typeof Platform>;

/**
 * COMO a demo chegou. E metadado de procedencia, nao de identidade: a mesma
 * partida pode chegar por varios caminhos e continua sendo uma partida so.
 *
 * `faceit_api` e deliberadamente diferente da plataforma `faceit`: uma demo do
 * FACEIT que voce baixou pelo site e `manual` + plataforma `faceit`. O nome
 * `faceit_api` fica reservado para uma integracao futura, se e quando os termos
 * forem verificados.
 */
export const SourceKind = z.enum([
  "steam_gcpd",
  "steam_auth_code",
  "manual",
  "faceit_api",
  "other",
]);
export type SourceKind = z.infer<typeof SourceKind>;

/**
 * Confianca na identidade da partida.
 *
 * `canonical`   -> ha um id estavel da plataforma; deduplica entre origens.
 * `provisional` -> nao ha; a identidade cai no sha256 do arquivo e NAO
 *                  deduplica contra a mesma partida vinda por outro caminho.
 *                  Marcado como tal em vez de fingir que resolveu.
 */
export const IdentityKind = z.enum(["canonical", "provisional"]);
export type IdentityKind = z.infer<typeof IdentityKind>;

export const MatchIdentity = z.strictObject({
  /**
   * Chave surrogate da partida. NAO e a identidade: a identidade e o par
   * (platform, platform_match_id). O Worker reutiliza o match_id de uma linha
   * existente quando esse par ja esta no banco, o que permite que a mesma
   * partida chegue por varias origens sem duplicar.
   */
  match_id: z.string().min(3).max(128),
  platform: Platform,
  /** Id estavel da plataforma. Null quando a identidade e provisoria. */
  platform_match_id: z.string().min(1).max(128).nullable(),
  identity_kind: IdentityKind,
  /** sha256 do arquivo .dem DESTE caminho. Dois caminhos podem diferir. */
  demo_sha256: Sha256Hex,
  demo_bytes: z.number().int().nonnegative(),
});
export type MatchIdentity = z.infer<typeof MatchIdentity>;

/** Como esta ingestao especifica chegou. Vai para `match_sources`. */
export const MatchArrival = z.strictObject({
  source_kind: SourceKind,
  /** Membro que trouxe a partida, quando conhecido. */
  discovered_by: PlayerRef.nullable(),
  /** Share code, nome do arquivo original, o que houver. Sem segredo. */
  source_ref: z.string().min(1).max(256).nullable(),
});
export type MatchArrival = z.infer<typeof MatchArrival>;

export const MatchSummary = z.strictObject({
  league_id: Slug,
  ...MatchIdentity.shape,
  ...MatchArrival.shape,
  map_name: z.string().min(1).max(64),
  /** Null quando a demo nao expoe horario confiavel. Nao inventar valor. */
  started_at: IsoDateTime.nullable(),
  duration_seconds: z.number().nonnegative().nullable(),
  rounds_played: z.number().int().nonnegative(),
  team_a_score: z.number().int().nonnegative(),
  team_b_score: z.number().int().nonnegative(),
  /** Quantos membros consentidos da liga jogaram esta partida. */
  member_count: z.number().int().nonnegative(),
  schema_version: SemVer,
  formula_version: SemVer,
});
export type MatchSummary = z.infer<typeof MatchSummary>;

export const MatchPlayer = z.strictObject({
  player_ref: PlayerRef,
  is_member: z.boolean(),
  /** Apelido so existe para membros. Terceiros tem sempre null. */
  display_name: z.string().min(1).max(64).nullable(),
  team: TeamSide,
  rounds_played: z.number().int().nonnegative(),
  kills: z.number().int().nonnegative(),
  deaths: z.number().int().nonnegative(),
  assists: z.number().int().nonnegative(),
  damage_dealt: z.number().int().nonnegative(),
});
export type MatchPlayer = z.infer<typeof MatchPlayer>;

export const RoundOutcome = z.strictObject({
  number: z.number().int().positive(),
  start_tick: z.number().int().nonnegative(),
  end_tick: z.number().int().nonnegative().nullable(),
  winner: z.enum(["team_a", "team_b"]).nullable(),
  reason: z.string().min(1).max(64).nullable(),
});
export type RoundOutcome = z.infer<typeof RoundOutcome>;
