import type { MatchListItem } from "@lobby/contracts";
import { FILTROS_VAZIOS, agregar, filtrar, type FiltrosPainel } from "../lib/painel.ts";

/**
 * Ilha interativa do painel.
 *
 * JavaScript puro, sem framework: o que o painel precisa é filtrar uma lista de
 * 28 itens e redesenhar três gráficos. Estado compartilhado disso cabe numa
 * variável.
 *
 * A tabela de partidas é renderizada pelo servidor e sobrevive sem JS — ela é a
 * "table view" que todo gráfico aqui precisa ter. Os gráficos são melhoria
 * progressiva: sem script, o leitor ainda tem todos os números.
 *
 * Rótulo de categoria (nome de mapa) vem da API, então é **dado não confiável**:
 * entra no DOM por `textContent`, nunca por concatenação de HTML.
 */

const ACCENT = "var(--color-accent)";

/** Especificação de marca: barra/coluna no máximo 24px, ponta de 4px. */
const COLUNA_MAX = 24;
const PONTA = 4;
/** Lacuna de 2px na cor da superfície separando marcas vizinhas. */
const LACUNA = 2;
/** Alvo de ponteiro maior que a marca: 8px de coluna é impossível de acertar. */
const ALVO_MIN = 24;

const SVG_NS = "http://www.w3.org/2000/svg";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  classe?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (classe) n.className = classe;
  return n;
}

function svgEl(tag: string, attrs: Record<string, string | number> = {}): SVGElement {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

function pt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${iso}T12:00:00.000Z`));
}

function plural(n: number, um: string, muitos: string): string {
  return `${n} ${n === 1 ? um : muitos}`;
}

// ---------------------------------------------------------------------------
// Tooltip único, compartilhado por todas as marcas.
// ---------------------------------------------------------------------------

let dica: HTMLDivElement | null = null;

function obterDica(): HTMLDivElement {
  if (dica) return dica;
  const d = el("div");
  d.className =
    "pointer-events-none fixed z-50 hidden max-w-[16rem] rounded-md border " +
    "border-line bg-sunk px-3 py-2 text-xs shadow-lg";
  document.body.append(d);
  dica = d;
  return d;
}

/**
 * Mostra a dica. O VALOR lidera em alto contraste e o rótulo vem depois: aqui o
 * leitor já sabe qual marca apontou e quer o número.
 */
function mostrarDica(alvo: Element, valor: string, rotulo: string, extra?: string): void {
  const d = obterDica();
  d.replaceChildren();

  const linhaValor = el("p", "num text-sm font-semibold text-ink");
  linhaValor.textContent = valor;
  const linhaRotulo = el("p", "mt-0.5 text-ink-soft");
  linhaRotulo.textContent = rotulo;
  d.append(linhaValor, linhaRotulo);

  if (extra) {
    const linhaExtra = el("p", "num mt-0.5 text-ink-faint");
    linhaExtra.textContent = extra;
    d.append(linhaExtra);
  }

  const r = alvo.getBoundingClientRect();
  d.classList.remove("hidden");
  const caixa = d.getBoundingClientRect();
  const x = Math.min(
    Math.max(8, r.left + r.width / 2 - caixa.width / 2),
    window.innerWidth - caixa.width - 8,
  );
  d.style.left = `${x}px`;
  d.style.top = `${Math.max(8, r.top - caixa.height - 8)}px`;
}

function esconderDica(): void {
  dica?.classList.add("hidden");
}

/** Mesma informação no foco do teclado e no ponteiro. */
function ligarDica(alvo: HTMLElement | SVGElement, valor: string, rotulo: string, extra?: string) {
  alvo.addEventListener("pointerenter", () => mostrarDica(alvo, valor, rotulo, extra));
  alvo.addEventListener("focus", () => mostrarDica(alvo, valor, rotulo, extra));
  alvo.addEventListener("pointerleave", esconderDica);
  alvo.addEventListener("blur", esconderDica);
}

// ---------------------------------------------------------------------------
// Gráfico de colunas: atividade por dia.
// ---------------------------------------------------------------------------

function desenharDias(destino: HTMLElement, pontos: { dia: string; partidas: number; rounds: number }[]): void {
  destino.replaceChildren();

  if (pontos.length === 0) {
    const vazio = el("p", "text-sm text-ink-faint");
    vazio.textContent = "Nenhuma partida com horario conhecido neste recorte.";
    destino.append(vazio);
    return;
  }

  const ALTURA = 132;
  const BASE = 112;
  const maximo = Math.max(...pontos.map((p) => p.partidas));
  const passo = Math.max(ALVO_MIN, Math.min(48, 760 / pontos.length));
  const largura = passo * pontos.length;
  const espessura = Math.min(COLUNA_MAX, passo - LACUNA * 2);

  const svg = svgEl("svg", {
    viewBox: `0 0 ${largura} ${ALTURA}`,
    width: largura,
    height: ALTURA,
    role: "img",
    "aria-label": `Partidas por dia, ${pontos.length} dias, maximo de ${maximo} num dia`,
  });
  svg.style.maxWidth = "100%";

  // Linha de base em cinza um passo fora da superfície, 1px, sólida.
  svg.append(
    svgEl("line", {
      x1: 0,
      y1: BASE + 0.5,
      x2: largura,
      y2: BASE + 0.5,
      stroke: "var(--color-line)",
      "stroke-width": 1,
    }),
  );

  const diaDoMaximo = pontos.find((p) => p.partidas === maximo)?.dia;

  pontos.forEach((p, i) => {
    const centro = i * passo + passo / 2;
    const alturaBarra = maximo === 0 ? 0 : (p.partidas / maximo) * (BASE - 24);

    if (p.partidas > 0) {
      // Ponta arredondada só no topo; quadrada na linha de base.
      const raio = Math.min(PONTA, alturaBarra / 2);
      const x = centro - espessura / 2;
      const y = BASE - alturaBarra;
      const caminho = svgEl("path", {
        d:
          `M ${x} ${BASE} L ${x} ${y + raio} Q ${x} ${y} ${x + raio} ${y} ` +
          `L ${x + espessura - raio} ${y} Q ${x + espessura} ${y} ${x + espessura} ${y + raio} ` +
          `L ${x + espessura} ${BASE} Z`,
        fill: ACCENT,
      });
      svg.append(caminho);
    } else {
      // Dia sem partida: traço mínimo na linha, para o vazio ser visível como
      // vazio em vez de parecer que o dia não existe.
      svg.append(
        svgEl("rect", {
          x: centro - espessura / 2,
          y: BASE - 2,
          width: espessura,
          height: 2,
          fill: "var(--color-line)",
        }),
      );
    }

    // Rótulo direto apenas no extremo. Número em toda coluna não se lê.
    if (p.dia === diaDoMaximo && p.partidas > 0) {
      const texto = svgEl("text", {
        x: centro,
        y: BASE - alturaBarra - 7,
        "text-anchor": "middle",
        fill: "var(--color-ink-soft)",
        "font-size": 11,
      });
      texto.textContent = String(p.partidas);
      svg.append(texto);
    }

    // Alvo de ponteiro cobrindo a faixa inteira, bem maior que a marca.
    const alvo = svgEl("rect", {
      x: i * passo,
      y: 0,
      width: passo,
      height: BASE,
      fill: "transparent",
      tabindex: 0,
      role: "img",
      "aria-label": `${pt(p.dia)}: ${plural(p.partidas, "partida", "partidas")}, ${p.rounds} rounds`,
    });
    alvo.style.cursor = "default";
    ligarDica(
      alvo,
      plural(p.partidas, "partida", "partidas"),
      pt(p.dia),
      p.rounds > 0 ? `${p.rounds} rounds` : undefined,
    );
    svg.append(alvo);
  });

  // Primeira e última data como referência do eixo.
  const eixo = el("div", "mt-1 flex justify-between text-xs text-ink-faint");
  const inicio = el("span");
  inicio.textContent = pt(pontos[0]!.dia);
  const fim = el("span");
  fim.textContent = pt(pontos[pontos.length - 1]!.dia);
  eixo.append(inicio, fim);

  const rolagem = el("div", "overflow-x-auto");
  rolagem.append(svg);
  destino.append(rolagem, eixo);
}

// ---------------------------------------------------------------------------
// Barras horizontais: mapas e composição do lobby.
// ---------------------------------------------------------------------------

function desenharBarras(
  destino: HTMLElement,
  fatias: { chave: string; valor: number }[],
  rotular: (chave: string) => string,
  total: number,
): void {
  destino.replaceChildren();

  const maximo = Math.max(1, ...fatias.map((f) => f.valor));
  if (fatias.every((f) => f.valor === 0)) {
    const vazio = el("p", "text-sm text-ink-faint");
    vazio.textContent = "Nada neste recorte.";
    destino.append(vazio);
    return;
  }

  for (const f of fatias) {
    const linha = el("div", "group flex items-center gap-3 py-1");
    linha.tabIndex = 0;
    linha.style.minHeight = `${ALVO_MIN}px`;

    const rotulo = el("span", "w-24 shrink-0 truncate text-sm text-ink-soft");
    rotulo.textContent = rotular(f.chave);

    const trilha = el("div", "relative h-3.5 flex-1 rounded-sm bg-sunk");
    const preenchimento = el("div", "h-full rounded-r-sm transition-[width] duration-200");
    preenchimento.style.width = `${f.valor === 0 ? 0 : Math.max(2, (f.valor / maximo) * 100)}%`;
    preenchimento.style.background = ACCENT;
    trilha.append(preenchimento);

    // Valor na ponta da barra.
    const valor = el("span", "num w-8 shrink-0 text-right text-sm font-semibold text-ink");
    valor.textContent = String(f.valor);

    linha.append(rotulo, trilha, valor);
    const parcela = total === 0 ? 0 : Math.round((f.valor / total) * 100);
    ligarDica(linha, plural(f.valor, "partida", "partidas"), rotular(f.chave), `${parcela}% do recorte`);
    destino.append(linha);
  }
}

// ---------------------------------------------------------------------------
// Estado e render.
// ---------------------------------------------------------------------------

function rotuloMapa(nome: string): string {
  return nome.replace(/^de_/, "");
}

function rotuloMembros(chave: string): string {
  return chave === "1" ? "1 membro" : `${chave} membros`;
}

function texto(seletor: string, valor: string): void {
  const n = document.querySelector<HTMLElement>(seletor);
  if (n) n.textContent = valor;
}

function iniciar(): void {
  const dados = document.getElementById("dados-painel");
  const painel = document.getElementById("painel");
  if (!dados?.textContent || !painel) return;

  let partidas: MatchListItem[];
  try {
    partidas = JSON.parse(dados.textContent) as MatchListItem[];
  } catch {
    // Dado malformado não pode apagar a página: a tabela do servidor continua.
    return;
  }

  const filtros: FiltrosPainel = { ...FILTROS_VAZIOS };
  const linhas = [...document.querySelectorAll<HTMLElement>("[data-partida]")];

  function render(): void {
    const recorte = filtrar(partidas, filtros);
    const r = agregar(recorte);

    texto("[data-figura]", String(r.partidas));
    texto("[data-figura-rotulo]", r.partidas === 1 ? "partida" : "partidas");
    texto("[data-kpi='rounds']", String(r.rounds));
    texto("[data-kpi='mediana']", r.roundsMedianos ? String(r.roundsMedianos) : "—");
    texto("[data-kpi='amigos']", String(r.comAmigos));
    texto("[data-kpi='mapas']", String(r.mapasDistintos));

    const dias = document.querySelector<HTMLElement>("[data-grafico='dias']");
    if (dias) desenharDias(dias, r.porDia);

    const mapas = document.querySelector<HTMLElement>("[data-grafico='mapas']");
    if (mapas) desenharBarras(mapas, r.porMapa.slice(0, 8), rotuloMapa, r.partidas);

    const lobby = document.querySelector<HTMLElement>("[data-grafico='lobby']");
    if (lobby) desenharBarras(lobby, r.porMembros, rotuloMembros, r.partidas);

    // A tabela é a mesma do servidor; o filtro só esconde linhas.
    const visiveis = new Set(recorte.map((p) => p.match_id));
    for (const linha of linhas) {
      const id = linha.dataset["partida"];
      linha.hidden = id !== undefined && !visiveis.has(id);
    }

    const vazio = document.querySelector<HTMLElement>("[data-tabela-vazia]");
    if (vazio) vazio.hidden = recorte.length > 0;
  }

  for (const grupo of document.querySelectorAll<HTMLElement>("[data-filtro]")) {
    const campo = grupo.dataset["filtro"] as keyof FiltrosPainel;
    for (const botao of grupo.querySelectorAll<HTMLButtonElement>("button[data-valor]")) {
      botao.addEventListener("click", () => {
        filtros[campo] = botao.dataset["valor"] as never;
        for (const outro of grupo.querySelectorAll<HTMLButtonElement>("button[data-valor]")) {
          const ativo = outro === botao;
          outro.setAttribute("aria-pressed", String(ativo));
        }
        esconderDica();
        render();
      });
    }
  }

  const seletorMapa = document.querySelector<HTMLSelectElement>("[data-filtro-mapa]");
  seletorMapa?.addEventListener("change", () => {
    filtros.mapa = seletorMapa.value as never;
    esconderDica();
    render();
  });

  // Mostra os controles só quando o JS assumiu, para não oferecer botão morto.
  document.querySelector<HTMLElement>("[data-controles]")?.removeAttribute("hidden");
  painel.removeAttribute("hidden");
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
