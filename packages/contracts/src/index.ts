/**
 * Contratos de LEITURA do espelho de design.
 *
 * Recorte do pacote original: aqui só entram os tipos que as telas consomem.
 * Os contratos de ingestão, assinatura HMAC, armazenamento e migração ficaram
 * de fora — não têm nada a ver com design e só aumentariam a superfície.
 */
export * from "./versions.ts";
export * from "./primitives.ts";
export * from "./match.ts";
export * from "./metrics.ts";
export * from "./career.ts";
export * from "./read.ts";
export * from "./hall.ts";
