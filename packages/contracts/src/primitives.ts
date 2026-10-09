import { z } from "zod";

/** SHA-256 em hexadecimal minusculo. */
export const Sha256Hex = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "esperado sha256 hex minusculo de 64 caracteres");

/** SteamID64 decimal (17 digitos, iniciando em 7656119). */
export const SteamId64 = z
  .string()
  .regex(/^7656119[0-9]{10}$/, "esperado SteamID64 decimal valido");

/** Slug seguro para id de liga, metrica e premio. */
export const Slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, "esperado slug minusculo [a-z0-9_-]");

/** Versao semantica simples "x.y.z". */
export const SemVer = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "esperado versao no formato x.y.z");

/**
 * Data/hora em UTC canonico, exatamente a saida de `Date.toISOString()`.
 *
 * A forma e exigida, nao apenas a validade: o D1 guarda isto como TEXT e ordena
 * lexicograficamente. Com fusos misturados, "2026-09-20T14:18:00-03:00" fica
 * ANTES de "2026-09-20T14:50:57.000Z" na ordenacao, invertendo a cronologia.
 * Em UTC canonico, ordem alfabetica e ordem do tempo.
 *
 * Quem produz o valor normaliza com `toCanonicalUtc` antes de enviar.
 */
export const IsoDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    "esperado data/hora em UTC canonico (2026-09-20T17:18:00.000Z)",
  );

/**
 * Converte qualquer entrada aceita por `Date` para o UTC canonico.
 * Lanca em entrada invalida: data errada e pior que data ausente.
 */
export function toCanonicalUtc(input: string): string {
  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) {
    throw new Error(`Data/hora invalida: "${input}". Use algo como 2026-09-20T14:18:00-03:00.`);
  }
  return new Date(parsed).toISOString();
}

/**
 * Referencia a um jogador DENTRO de uma partida.
 *
 *  - "steam:<SteamID64>" apenas para membros da liga com consentimento.
 *  - "anon:<16 hex>"     para qualquer terceiro. O hash usa um sal aleatorio
 *                        gerado por partida e descartado, entao a referencia e
 *                        consistente dentro da partida e inutil fora dela.
 */
export const PlayerRef = z
  .string()
  .regex(/^(steam:7656119[0-9]{10}|anon:[0-9a-f]{16})$/, "esperado player_ref valido");

export type PlayerRef = z.infer<typeof PlayerRef>;

export const ANON_PREFIX = "anon:";
export const STEAM_PREFIX = "steam:";

export function isMemberRef(ref: string): boolean {
  return ref.startsWith(STEAM_PREFIX);
}

export function memberRef(steamId64: string): string {
  return `${STEAM_PREFIX}${steamId64}`;
}

export function anonRef(hash16: string): string {
  return `${ANON_PREFIX}${hash16}`;
}

/** Lado do time fixado pela composicao do 1o round; nao muda na troca de lados. */
export const TeamSide = z.enum(["team_a", "team_b", "spectator"]);
export type TeamSide = z.infer<typeof TeamSide>;
