import { caminhoArredondado, quebrarLinhas } from "./ctx.ts";
import type { Ctx2D, FabricaDeCaminho } from "./ctx.ts";
import { cenaDe } from "./ilustracoes.ts";

/**
 * Card compartilhável, no MESMO layout do card da tela.
 *
 * A versão anterior era um tabloide vertical 1080×1350, e o resultado era que a
 * imagem baixada não parecia o card que a pessoa tinha acabado de ver. Agora os
 * dois seguem a mesma anatomia: miniatura à esquerda, título e frase à direita,
 * régua, número grande com unidade e o bruto separados por divisória, régua,
 * rodapé com autor e partida.
 *
 * A diferença é só o que não faz sentido numa imagem: os botões saem, e entra a
 * marca do HALL no rodapé, para o card compartilhado dizer de onde veio.
 *
 * **Nada aqui calcula.** Todo número chega pronto em `DadosDoCard`.
 */

export const LARGURA = 1200;
// 900 deixava ~250px de vazio entre o número e o rodapé: a moldura é fixa e o
// conteúdo terminava bem antes dela. 700 encosta o rodapé no conteúdo.
export const ALTURA = 700;

/** Mesmos tokens de `apps/web/src/styles/global.css`, em um lugar só. */
export const COR = {
  ground: "#0d0e10",
  surface: "#17191d",
  sunk: "#08090b",
  line: "#282b31",
  ink: "#eef0f2",
  inkSoft: "#9aa0a8",
  inkFaint: "#727880",
  accent: "#f5a524",
  accentGhost: "#3d2a0d",
  warn: "#e5484d",
} as const;

export const FONTE_DISPLAY = "'IBM Plex Sans Condensed', 'Segoe UI', Arial, sans-serif";
export const FONTE_CORPO = "'IBM Plex Sans', 'Segoe UI', Arial, sans-serif";
export const FONTE_MONO = "'IBM Plex Mono', Consolas, monospace";

export interface LadoDoCard {
  rotulo: string;
  valor: string;
  unidade: string;
  bruto: string;
  proporcao: number;
}

export interface DadosDoCard {
  /** Chave da ilustração: `record_id` do Hall ou `award_id` do Jornal. */
  chave: string;
  /** Métrica, usada como segunda tentativa para escolher a ilustração. */
  metrica?: string;
  /** Título do recorde. */
  manchete: string;
  /** A frase de humor, entre aspas. */
  frase: string;
  jogador: string;
  iniciais: string;
  /** "Nuke · 20/09 · 14r" */
  rodape: string;
  /** Data da edição. Fica no rodapé, ao lado da marca. */
  edicao: string;
  /** Um lado (recorde do Hall) ou dois (prêmio de contraste do Jornal). */
  lados: LadoDoCard[];
  /** Multiplicador do prêmio: "3,34×". */
  selo?: string;
  /**
   * Faixa curta ao lado do número, para uma qualificação do próprio valor
   * ("RECORDE ABSOLUTO"). Não é o selo: o selo é imagem e mora no canto da
   * ilustração. Só vale para card de um lado.
   */
  faixa?: string;
  tom: "vergonha" | "fama";
}

/**
 * Imagens já carregadas pelo host.
 *
 * O card não carrega nada: cada host resolve do seu jeito (`loadImage` no
 * coletor, `new Image()` no navegador) e entrega pronto. Ausente, o desenho cai
 * na cena vetorial — o card nunca sai sem ilustração.
 */
export interface ImagensDoCard {
  ilustracao?: unknown;
  selo?: unknown;
  logo?: unknown;
}

const MARGEM = 40;
const PAD = 44;

function desenharCena(
  ctx: Ctx2D,
  caminho: FabricaDeCaminho,
  chave: string,
  metrica: string | undefined,
  x: number,
  y: number,
  lado: number,
): void {
  const cena = cenaDe(chave, metrica);
  const escala = lado / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);

  ctx.fillStyle = COR.accentGhost;
  for (const d of cena.preenchidos ?? []) ctx.fill(caminho(d));
  ctx.strokeStyle = COR.accent;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of cena.tracos) ctx.stroke(caminho(d));
  ctx.strokeStyle = COR.inkSoft;
  ctx.lineWidth = 5;
  for (const d of cena.detalhes ?? []) ctx.stroke(caminho(d));
  ctx.restore();
}

function regua(ctx: Ctx2D, x: number, y: number, largura: number): void {
  ctx.fillStyle = COR.line;
  ctx.fillRect(x, y, largura, 1);
}

export function desenharCard(
  ctx: Ctx2D,
  caminho: FabricaDeCaminho,
  dados: DadosDoCard,
  imagens: ImagensDoCard = {},
): void {
  const corTom = dados.tom === "vergonha" ? COR.warn : COR.accent;
  const x0 = MARGEM + PAD;
  const x1 = LARGURA - MARGEM - PAD;
  const larguraUtil = x1 - x0;

  // ---- Fundo e moldura ------------------------------------------------------
  ctx.fillStyle = COR.ground;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.fillStyle = COR.surface;
  caminhoArredondado(ctx, MARGEM, MARGEM, LARGURA - MARGEM * 2, ALTURA - MARGEM * 2, 24);
  ctx.fill();

  ctx.strokeStyle = COR.line;
  ctx.lineWidth = 2;
  caminhoArredondado(ctx, MARGEM, MARGEM, LARGURA - MARGEM * 2, ALTURA - MARGEM * 2, 24);
  ctx.stroke();

  // ---- Miniatura ------------------------------------------------------------
  const miniW = 300;
  const miniH = 225;
  const miniY = MARGEM + PAD;

  ctx.save();
  caminhoArredondado(ctx, x0, miniY, miniW, miniH, 14);
  ctx.fillStyle = COR.sunk;
  ctx.fill();
  ctx.clip();
  if (imagens.ilustracao) {
    ctx.drawImage(imagens.ilustracao, x0, miniY, miniW, miniH);
  } else {
    // Sem arte: a cena vetorial, centralizada no quadro.
    const lado = Math.min(miniW, miniH) - 32;
    desenharCena(
      ctx,
      caminho,
      dados.chave,
      dados.metrica,
      x0 + (miniW - lado) / 2,
      miniY + (miniH - lado) / 2,
      lado,
    );
  }
  ctx.restore();

  // ---- Título, frase e selo -------------------------------------------------
  const textoX = x0 + miniW + 36;
  const seloW = 230;
  /*
   * Reserva do selo. Vale para o título E para a frase: na primeira versão só o
   * título a respeitava, e a frase corria por baixo do carimbo, ficando
   * ilegível na parte coberta.
   */
  const reservaSelo = imagens.selo || dados.selo ? seloW + 24 : 0;
  const tituloMax = x1 - textoX - reservaSelo;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COR.ink;
  ctx.font = `700 54px ${FONTE_DISPLAY}`;
  let y = miniY + 54;
  for (const linha of quebrarLinhas(ctx, dados.manchete, tituloMax, 2)) {
    ctx.fillText(linha, textoX, y);
    y += 58;
  }

  ctx.fillStyle = COR.inkSoft;
  ctx.font = `italic 400 26px ${FONTE_CORPO}`;
  y += 8;
  for (const linha of quebrarLinhas(ctx, `“${dados.frase}”`, tituloMax, 3)) {
    ctx.fillText(linha, textoX, y);
    y += 34;
  }

  if (imagens.selo) {
    ctx.drawImage(imagens.selo, x1 - seloW, miniY - 10, seloW, seloW * 0.75);
  } else if (dados.selo) {
    // Sem imagem de selo, o multiplicador vira pílula.
    const w = 150;
    ctx.fillStyle = dados.tom === "vergonha" ? "#3a1b1c" : COR.accentGhost;
    caminhoArredondado(ctx, x1 - w, miniY, w, 62, 31);
    ctx.fill();
    ctx.fillStyle = corTom;
    ctx.font = `600 36px ${FONTE_MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dados.selo, x1 - w / 2, miniY + 32);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // ---- Números --------------------------------------------------------------
  const numerosY = Math.max(miniY + miniH + 46, y + 30);
  regua(ctx, x0, numerosY, larguraUtil);

  if (dados.lados.length === 1) {
    // Recorde do Hall: valor + unidade à esquerda, divisória, bruto à direita.
    const lado = dados.lados[0]!;
    const linha = numerosY + 96;

    ctx.fillStyle = COR.ink;
    ctx.font = `700 84px ${FONTE_CORPO}`;
    ctx.fillText(lado.valor, x0, linha);
    const largValor = ctx.measureText(lado.valor).width;

    ctx.fillStyle = COR.inkSoft;
    ctx.font = `400 32px ${FONTE_CORPO}`;
    const xUnidade = x0 + largValor + 16;
    ctx.fillText(lado.unidade, xUnidade, linha);
    const largUnidade = ctx.measureText(lado.unidade).width;

    const divisoriaX = x1 - 330;

    /*
     * A faixa só é desenhada se COUBER antes da divisória. A alternativa seria
     * encavalar texto sobre texto num card que vai para o WhatsApp — pior que
     * não mostrar. Valor e unidade variam de largura por recorde, então a
     * decisão é por medição, não por um número fixo de caracteres.
     */
    if (dados.faixa) {
      const xFaixa = xUnidade + largUnidade + 20;
      ctx.font = `600 20px ${FONTE_MONO}`;
      const largTexto = ctx.measureText(dados.faixa).width;
      const largPilula = largTexto + 28;

      if (xFaixa + largPilula + 24 <= divisoriaX) {
        ctx.strokeStyle = COR.accent;
        ctx.lineWidth = 2;
        caminhoArredondado(ctx, xFaixa, linha - 42, largPilula, 38, 6);
        ctx.stroke();

        ctx.fillStyle = COR.accent;
        ctx.textBaseline = "middle";
        ctx.fillText(dados.faixa, xFaixa + 14, linha - 23);
        ctx.textBaseline = "alphabetic";
      }
    }

    ctx.fillStyle = COR.line;
    ctx.fillRect(divisoriaX, linha - 48, 1, 56);

    ctx.fillStyle = COR.inkFaint;
    ctx.font = `400 28px ${FONTE_MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(lado.bruto, x1, linha - 12);
    ctx.textAlign = "left";
  } else {
    // Prêmio de contraste: os dois lados lado a lado, com barra.
    const maximo = Math.max(...dados.lados.map((l) => l.proporcao), 0.0001);
    const lacuna = 24;
    const largCaixa = (larguraUtil - lacuna) / 2;

    dados.lados.forEach((lado, i) => {
      const cx = x0 + i * (largCaixa + lacuna);
      const base = numerosY + 44;

      ctx.fillStyle = COR.inkFaint;
      ctx.font = `500 22px ${FONTE_MONO}`;
      ctx.fillText(lado.rotulo, cx, base);

      ctx.fillStyle = COR.ink;
      ctx.font = `700 60px ${FONTE_CORPO}`;
      ctx.fillText(lado.valor, cx, base + 64);
      const largValor = ctx.measureText(lado.valor).width;

      ctx.fillStyle = COR.inkSoft;
      ctx.font = `400 24px ${FONTE_CORPO}`;
      ctx.fillText(lado.unidade, cx + largValor + 12, base + 64);

      const barraY = base + 84;
      ctx.fillStyle = COR.sunk;
      caminhoArredondado(ctx, cx, barraY, largCaixa, 14, 7);
      ctx.fill();
      ctx.fillStyle = i === 0 ? corTom : COR.accentGhost;
      caminhoArredondado(ctx, cx, barraY, Math.max(14, (lado.proporcao / maximo) * largCaixa), 14, 7);
      ctx.fill();

      ctx.fillStyle = COR.inkFaint;
      ctx.font = `400 21px ${FONTE_MONO}`;
      ctx.fillText(lado.bruto, cx, base + 132);
    });
  }

  // ---- Rodapé ---------------------------------------------------------------
  const rodapeRegua = ALTURA - MARGEM - PAD - 116;
  regua(ctx, x0, rodapeRegua, larguraUtil);

  const linhaRodape = rodapeRegua + 62;

  // Anel com as iniciais, como o avatar vazado da tela.
  ctx.strokeStyle = COR.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x0 + 28, linhaRodape - 10, 28, 0, Math.PI * 2);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = COR.accent;
  ctx.font = `600 24px ${FONTE_CORPO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dados.iniciais, x0 + 28, linhaRodape - 9);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COR.ink;
  ctx.font = `700 36px ${FONTE_DISPLAY}`;
  ctx.fillText(dados.jogador, x0 + 70, linhaRodape);

  ctx.fillStyle = COR.inkFaint;
  ctx.font = `400 26px ${FONTE_MONO}`;
  ctx.textAlign = "right";
  ctx.fillText(dados.rodape, x1, linhaRodape);
  ctx.textAlign = "left";

  // Marca: o card compartilhado precisa dizer de onde veio.
  const marcaY = ALTURA - MARGEM - PAD + 6;
  if (imagens.logo) {
    ctx.drawImage(imagens.logo, x0, marcaY - 34, 132, 44);
  } else {
    ctx.fillStyle = COR.accent;
    ctx.font = `600 24px ${FONTE_MONO}`;
    ctx.fillText("HALL", x0, marcaY);
  }

  ctx.fillStyle = COR.inkFaint;
  ctx.font = `400 22px ${FONTE_MONO}`;
  ctx.textAlign = "right";
  ctx.fillText(dados.edicao, x1, marcaY);
  ctx.textAlign = "left";
}
