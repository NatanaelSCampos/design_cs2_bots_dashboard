import type {
  AwardsReport as AwardsReportType,
  HallReport as HallReportType,
  MatchDetail as MatchDetailType,
  MatchList as MatchListType,
  PlayerProfile as PlayerProfileType,
} from "@lobby/contracts";

import hall from "../fixtures/hall.json";
import premios from "../fixtures/premios.json";
import partidas from "../fixtures/partidas.json";
import perfis from "../fixtures/perfis.json";
import detalhes from "../fixtures/detalhes.json";

/**
 * ESPELHO DE DESIGN — esta camada NÃO fala com servidor nenhum.
 *
 * No projeto original este arquivo assina cada requisição com HMAC e chama um
 * Cloudflare Worker, que lê de um banco D1. Aqui ele devolve FIXTURES
 * SINTÉTICAS de arquivos JSON locais, para o site subir sozinho com um
 * `npm install && npm run dev`, sem backend, sem credencial e sem rede.
 *
 * As fixtures saíram de respostas reais da API e passaram por anonimização:
 * apelidos, SteamIDs e identificadores de partida foram substituídos por
 * valores inventados. Os números (dano, abates, rounds) são reais, mas não há
 * como ligá-los a ninguém. Nada aqui identifica uma pessoa.
 *
 * O formato é exatamente o do contrato de leitura, então as telas são as mesmas
 * do projeto de verdade — é essa fidelidade que torna o espelho útil.
 */

export class ApiError extends Error {
  readonly status: number | null;
  constructor(mensagem: string, status: number | null) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Atraso artificial? Não. O espelho é síncrono; a Promise é só da assinatura. */
async function entregar<T>(valor: T): Promise<T> {
  return valor;
}

export async function listarPartidas(limite = 50): Promise<MatchListType> {
  const lista = partidas as unknown as MatchListType;
  return entregar({ ...lista, matches: lista.matches.slice(0, limite) });
}

export async function buscarPartida(matchId: string): Promise<MatchDetailType | null> {
  const mapa = detalhes as unknown as Record<string, MatchDetailType>;
  // 404 não é falha: é "essa partida não existe", e a página trata.
  return entregar(mapa[matchId] ?? null);
}

export async function buscarJogador(playerRef: string): Promise<PlayerProfileType | null> {
  const mapa = perfis as unknown as Record<string, PlayerProfileType>;
  return entregar(mapa[playerRef] ?? null);
}

export async function buscarHall(): Promise<HallReportType> {
  return entregar(hall as unknown as HallReportType);
}

export async function buscarPremios(): Promise<AwardsReportType> {
  return entregar(premios as unknown as AwardsReportType);
}
