import { ALTURA, LARGURA, desenharCard } from "@lobby/card";
import type { DadosDoCard, ImagensDoCard } from "@lobby/card";

/**
 * Compartilhamento do card como imagem.
 *
 * O que a web permite, de verdade:
 *
 *  - **Instagram não tem URL de compartilhamento.** Não existe forma de uma
 *    página montar um post. O único caminho é `navigator.share` com arquivo,
 *    que abre a bandeja nativa do sistema — e o Instagram aparece lá.
 *  - **`wa.me?text=` não anexa imagem.** Só texto e link. Mandar a imagem usa
 *    a mesma Web Share API.
 *
 * Por isso aqui existe UM botão de compartilhar, que no celular entrega o PNG
 * para qualquer app, e saídas de desktop (baixar e copiar). Botões coloridos de
 * Instagram e WhatsApp que anexam imagem simplesmente não existem na web, e
 * fingir que existem entregaria botão que não faz nada.
 *
 * O PNG é desenhado pelo MESMO código que gera o card do Discord
 * (`@lobby/card`), então o que a pessoa compartilha e o que vai para o Discord
 * são o mesmo card.
 */

/**
 * Carrega uma imagem para o canvas.
 *
 * Devolve `undefined` em vez de rejeitar: ilustração que não carrega não pode
 * impedir o compartilhamento — o card cai na cena vetorial e sai assim mesmo.
 */
function carregar(url: string | undefined): Promise<HTMLImageElement | undefined> {
  if (!url) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

async function imagensDe(raiz: HTMLElement): Promise<ImagensDoCard> {
  const url = (atributo: string) => raiz.dataset[atributo];
  const [ilustracao, selo, logo] = await Promise.all([
    carregar(url("ilustracao")),
    carregar(url("selo")),
    carregar(url("logo")),
  ]);
  return { ilustracao, selo, logo };
}

async function gerarPng(dados: DadosDoCard, imagens: ImagensDoCard): Promise<Blob> {
  // A identidade usa IBM Plex, carregada pela página. Desenhar antes de a fonte
  // estar pronta renderiza o card inteiro na fonte de fallback.
  if (document.fonts?.ready) await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador nao expos o contexto 2D do canvas.");

  desenharCard(ctx as never, (d) => new Path2D(d), dados, imagens);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) throw new Error("Nao consegui gerar o PNG.");
  return blob;
}

function nomeDoArquivo(dados: DadosDoCard): string {
  const limpo = `${dados.jogador}-${dados.manchete}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `jornal-do-lobby-${limpo}.png`;
}

function baixar(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  // Revogar na hora cancelaria o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Troca só o rótulo, nunca o conteúdo do botão: escrever em `botao.textContent`
 * apagaria o ícone SVG junto.
 */
function avisar(botao: HTMLElement, texto: string): void {
  const alvo = botao.querySelector<HTMLElement>("[data-rotulo]");
  if (!alvo) return;
  const original = alvo.dataset["original"] ?? alvo.textContent ?? "";
  alvo.dataset["original"] = original;
  alvo.textContent = texto;
  setTimeout(() => {
    alvo.textContent = original;
  }, 2200);
}

function lerDados(raiz: HTMLElement): DadosDoCard | null {
  const bruto = raiz.querySelector<HTMLScriptElement>("script[type='application/json']");
  if (!bruto?.textContent) return null;
  try {
    return JSON.parse(bruto.textContent) as DadosDoCard;
  } catch {
    return null;
  }
}

function ligar(raiz: HTMLElement): void {
  const dados = lerDados(raiz);
  if (!dados) return;

  const compartilhar = raiz.querySelector<HTMLButtonElement>("[data-acao='compartilhar']");
  const baixarBtn = raiz.querySelector<HTMLButtonElement>("[data-acao='baixar']");
  const copiar = raiz.querySelector<HTMLButtonElement>("[data-acao='copiar']");

  // Só mostra "compartilhar" onde ele de fato entrega arquivo. Em desktop sem
  // suporte, o botão some em vez de abrir uma bandeja sem a imagem.
  const arquivoTeste = new File([new Blob()], "x.png", { type: "image/png" });
  const podeCompartilhar =
    typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivoTeste] });

  if (compartilhar) {
    if (!podeCompartilhar) compartilhar.hidden = true;
    else
      compartilhar.addEventListener("click", async () => {
        try {
          const blob = await gerarPng(dados, await imagensDe(raiz));
          const arquivo = new File([blob], nomeDoArquivo(dados), { type: "image/png" });
          await navigator.share({ files: [arquivo], title: dados.manchete });
        } catch (erro) {
          // Cancelar a bandeja dispara AbortError: não é falha, é desistência.
          if ((erro as Error).name !== "AbortError") avisar(compartilhar, "não deu");
        }
      });
  }

  baixarBtn?.addEventListener("click", async () => {
    try {
      baixar(await gerarPng(dados, await imagensDe(raiz)), nomeDoArquivo(dados));
    } catch {
      avisar(baixarBtn, "não deu");
    }
  });

  if (copiar) {
    const podeCopiar = typeof ClipboardItem !== "undefined" && !!navigator.clipboard?.write;
    if (!podeCopiar) copiar.hidden = true;
    else
      copiar.addEventListener("click", async () => {
        try {
          const blob = await gerarPng(dados, await imagensDe(raiz));
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          avisar(copiar, "copiado!");
        } catch {
          avisar(copiar, "não deu");
        }
      });
  }

  raiz.removeAttribute("hidden");
}

function iniciar(): void {
  for (const raiz of document.querySelectorAll<HTMLElement>("[data-compartilhar]")) ligar(raiz);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
