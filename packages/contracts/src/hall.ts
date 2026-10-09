import { z } from "zod";
import { IsoDateTime, PlayerRef, SemVer, Slug } from "./primitives.ts";

/**
 * Hall da Fama e da Vergonha: recordes de UMA partida, não de carreira.
 *
 * Tudo é normalizado por round. Sem isso, "mais mortes" premiaria sempre a
 * partida mais longa, e uma Wingman de 12 rounds nunca disputaria com uma
 * Premier de 29. O número bruto viaja junto para conferência.
 *
 * Só membros consentidos entram. Terceiros são anonimizados por partida e não
 * têm histórico para sustentar recorde.
 */

/** Como o valor deve ser lido. A formatação em si é da camada de apresentação. */
export const HallUnit = z.enum(["por_round", "percentual", "razao"]);
export type HallUnit = z.infer<typeof HallUnit>;

export const HallKind = z.enum(["vergonha", "fama"]);
export type HallKind = z.infer<typeof HallKind>;

export const HallEntry = z.strictObject({
  record_id: Slug,
  kind: HallKind,
  /** Título curto, em PT-BR. */
  title: z.string().min(1).max(64),
  /** Frase humorística. Humor sim, número inventado não. */
  blurb: z.string().min(1).max(200),
  /** O que está sendo medido, para a legenda da tabela. */
  stat_label: z.string().min(1).max(64),
  unit: HallUnit,
  /**
   * Substantivo da unidade, para o número grande não ficar sem significado.
   *
   * `unit` diz a FORMA ("por round", "percentual"), nunca o QUÊ. Sem isto o
   * Hall mostrava "29,86" e o leitor não tinha como saber se eram pontos de
   * dano, mortes ou segundos — o substantivo só existia em texto livre no
   * rodapé do card. Exemplos: "dano", "mortes", "abates", "s".
   */
  stat_unit: z.string().min(1).max(16),

  player_ref: PlayerRef,
  display_name: z.string().min(1).max(64).nullable(),

  value: z.number().finite(),
  numerator: z.number().finite(),
  denominator: z.number().finite().nonnegative(),

  match_id: z.string().min(1),
  map_name: z.string().min(1),
  started_at: IsoDateTime.nullable(),
  rounds: z.number().int().nonnegative(),
});
export type HallEntry = z.infer<typeof HallEntry>;

/**
 * Um recorte do Hall: os mesmos recordes, uma janela menor de partidas.
 *
 * O Hall absoluto congela com o tempo. Depois de algumas dezenas de partidas,
 * bater um extremo histórico fica raro, e a página passa semanas idêntica
 * mesmo com a coleta funcionando — foi exatamente o que aconteceu. O recorte
 * resolve isso sem inventar dado: é o mesmo cálculo sobre as partidas
 * recentes, então toda partida nova pode trocar um card.
 *
 * A janela é por CONTAGEM de partidas, não por calendário. "Mês corrente"
 * zeraria a página todo dia 1º, quando ainda não há amostra no mês.
 */
export const HallWindow = z.strictObject({
  window_id: Slug,
  /** Rótulo pronto para a tela, em PT-BR. */
  label: z.string().min(1).max(40),
  /** Partidas consideradas neste recorte. */
  matches: z.number().int().nonnegative(),
  qualifying_performances: z.number().int().nonnegative(),
  vergonha: z.array(HallEntry),
  fama: z.array(HallEntry),
  notes: z.array(z.string().min(1).max(280)),
});
export type HallWindow = z.infer<typeof HallWindow>;

export const HallReport = z.strictObject({
  league_id: Slug,
  generated_at: IsoDateTime,
  formula_version: SemVer,
  /** Rounds mínimos para uma atuação disputar recorde. */
  min_rounds: z.number().int().nonnegative(),
  /** Atuações (jogador × partida) que passaram no mínimo de rounds. */
  qualifying_performances: z.number().int().nonnegative(),
  vergonha: z.array(HallEntry),
  fama: z.array(HallEntry),
  /** Por que um recorde não saiu, em português. */
  notes: z.array(z.string().min(1).max(280)),
  /**
   * Recortes além do absoluto. Vem vazio enquanto o histórico couber inteiro
   * na janela: aí o recorte repetiria o Hall absoluto card por card.
   */
  windows: z.array(HallWindow),
});
export type HallReport = z.infer<typeof HallReport>;
