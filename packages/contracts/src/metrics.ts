import { z } from "zod";
import { PlayerRef, SemVer, Slug } from "./primitives.ts";

/**
 * Resultado de uma metrica para um jogador em uma partida.
 *
 * numerator/denominator sao obrigatorios para que qualquer numero exibido no
 * site possa ser auditado sem reprocessar a demo. value e sempre derivado
 * deles (ou 0 quando denominator = 0).
 */
export const MetricResult = z.strictObject({
  metric_id: Slug,
  formula_version: SemVer,
  player_ref: PlayerRef,
  value: z.number().finite(),
  numerator: z.number().finite(),
  denominator: z.number().finite().nonnegative(),
  /** Amostra minima exigida por esta metrica (em unidades do denominador). */
  min_sample: z.number().int().nonnegative(),
  /** false => o valor existe mas nao pode disputar premio. */
  sample_ok: z.boolean(),
});
export type MetricResult = z.infer<typeof MetricResult>;

/**
 * Premio atribuido a partir de uma metrica. Guarda o criterio junto com o
 * resultado para que a pagina de explicacao nao precise reimplementar a regra.
 */
export const AwardResult = z.strictObject({
  award_id: Slug,
  metric_id: Slug,
  formula_version: SemVer,
  winner_ref: PlayerRef,
  value: z.number().finite(),
  numerator: z.number().finite(),
  denominator: z.number().finite().nonnegative(),
  /** Texto curto e literal do criterio, em PT-BR. */
  criterion: z.string().min(1).max(280),
  /** Empates: todos os refs empatados, incluindo o winner_ref. */
  tied_with: z.array(PlayerRef),
});
export type AwardResult = z.infer<typeof AwardResult>;
