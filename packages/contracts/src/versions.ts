/**
 * Versoes gravadas em toda partida persistida.
 *
 * - SCHEMA_VERSION  muda quando a forma do bundle de eventos muda.
 * - FORMULA_VERSION muda quando QUALQUER metrica/premio muda de definicao.
 *   Resultados sao chaveados por formula_version, entao um recalculo com
 *   versao nova convive com a antiga em vez de sobrescreve-la.
 * - EVENTS_OBJECT_VERSION entra no nome do objeto no R2.
 */
export const SCHEMA_VERSION = "1.2.0";
export const FORMULA_VERSION = "1.3.0";
export const EVENTS_OBJECT_VERSION = "v1";

/** Versao do sanitizador; muda quando a regra de anonimizacao muda. */
export const SANITIZER_VERSION = "1.0.0";
