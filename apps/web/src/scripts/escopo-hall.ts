/**
 * Alternância entre os recortes do Hall ("Últimas N partidas" / "De sempre").
 *
 * Os dois recortes vêm renderizados no HTML; aqui só se troca qual está
 * visível. Isso mantém a página inteira funcional sem JS: sem este script, o
 * recorte padrão (o recente) continua na tela — perde-se a alternância, não o
 * conteúdo.
 */

const abas = document.querySelectorAll<HTMLButtonElement>("[data-aba-escopo]");
const paineis = document.querySelectorAll<HTMLElement>("[data-escopo]");

function mostrar(alvo: string): void {
  for (const painel of paineis) {
    painel.classList.toggle("hidden", painel.dataset.escopo !== alvo);
  }
  for (const aba of abas) {
    const ativa = aba.dataset.abaEscopo === alvo;
    aba.setAttribute("aria-selected", String(ativa));
    // `tabindex` segue a aba ativa: num tablist, Tab entra no grupo uma vez e
    // as setas andam entre as abas.
    aba.tabIndex = ativa ? 0 : -1;
  }
}

abas.forEach((aba, i) => {
  aba.addEventListener("click", () => {
    const alvo = aba.dataset.abaEscopo;
    if (alvo) mostrar(alvo);
  });

  aba.addEventListener("keydown", (ev) => {
    const passo = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
    if (passo === 0) return;
    ev.preventDefault();
    const proxima = abas[(i + passo + abas.length) % abas.length];
    proxima?.focus();
    proxima?.click();
  });
});
