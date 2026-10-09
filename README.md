# HALL — CS2 EDITION · espelho de design

Front-end de um site privado de estatísticas de Counter-Strike 2 para um grupo
de dez amigos. Este repositório é um **espelho só de design**: contém as telas,
os componentes, os tokens e os assets, e **nada de backend**.

Ele sobe sozinho, sem servidor, sem banco e sem credencial:

```bash
npm install
npm run dev     # http://localhost:4321
```

---

## O que é o produto

O site transforma partidas de CS2 em três coisas:

1. **Hall da Fama e da Vergonha** — recordes de *uma partida só*, não de
   carreira. Dezesseis recordes fixos, cada um com um card ilustrado: quem deu
   menos dano por round, quem mais morreu, quem mais cegou o próprio time.
   O tom é de zoeira entre amigos, não de relatório de e-sport.
2. **Jornal** — perfil por jogador, com estatísticas de carreira e prêmios que
   comparam contextos ("com amigos" vs "sozinho").
3. **Cards compartilháveis** — cada recorde vira um PNG que a pessoa manda no
   WhatsApp ou no Instagram. O card é desenhado em `<canvas>` pelo mesmo
   código que o site usa, para a imagem compartilhada nunca divergir da tela.

O Hall tem dois recortes, alternáveis por abas: **"Últimas 10 partidas"**
(padrão) e **"De sempre"**. Um card do recorte recente que também é o extremo
histórico ganha a faixa `RECORDE ABSOLUTO`.

## Identidade visual

Tema escuro, único — não há modo claro. Estética de jornal popular / fanzine:
tipografia pesada, selos que imitam carimbo de tinta, anotações manuscritas nas
margens e objetos de cenário (caixas, granadas, estojos de bala) espalhados
fora da coluna de conteúdo, desfocados para ficarem atrás do texto.

A arte está toda aqui: **16 ilustrações** (uma por recorde, 4:3, em
`assets/ilustracoes/`), **21 selos** que imitam carimbo (`assets/selos/`) e
**10 objetos de cenário** (`assets/laterais/`), além de logo, banner e ícones
de navegação.

Os tokens vivem em **`apps/web/src/styles/global.css`** — é o arquivo mais
importante para entender o visual. Em resumo:

| Token | Valor | Papel |
|---|---|---|
| `--color-ground` | `#0d0e10` | fundo da página |
| `--color-surface` | `#17191d` | fundo dos cards |
| `--color-line` | `#282b31` | bordas e divisórias |
| `--color-ink` | `#eef0f2` | texto principal |
| `--color-ink-soft` | `#9aa0a8` | texto secundário |
| `--color-ink-faint` | `#727880` | texto terciário, números brutos |
| `--color-accent` | `#f5a524` | âmbar: a cor da marca |
| `--color-warn` | `#e5484d` | vermelho: reservado para "vergonha" |
| `--font-mao` | Caveat | anotações manuscritas |

Âmbar é a única cor de destaque. Vermelho é **status**, não decoração: marca o
tom "vergonha" e nunca é usado como "mais uma cor da paleta".

## Estrutura

```
apps/web/src/
  assets/       imagens da identidade: logo, banner, selos, ícones laterais
  components/   os blocos de tela (CardRecorde, HeroHall, Compartilhar, ...)
  layouts/      Base.astro — casca comum, navegação e rodapé
  pages/        as seis telas
  lib/          formatação, cores derivadas, agregações — sem desenho
  styles/       global.css: TODOS os tokens
  scripts/      comportamento de cliente (abas do Hall, gerar PNG do card)
  fixtures/     dados sintéticos (ver abaixo)
packages/
  card/         desenho do card em canvas, compartilhado com o site
  contracts/    tipos das respostas da API (recorte só-leitura)
referencia/
  cards/        PNGs de exemplo dos cards compartilháveis
  html/         HTML renderizado de cada tela
```

Stack: **Astro 7 + TypeScript estrito + Tailwind 4**. Tailwind v4 não tem
`tailwind.config.js` — a configuração inteira está em `global.css`, via `@theme`.

As páginas são `.astro`: HTML com um bloco de script no topo que roda no
servidor. Não há React. Interação de cliente é JavaScript puro, nos arquivos de
`src/scripts/`.

### Telas

| Rota | O que é |
|---|---|
| `/` | painel com filtros (formato, lobby, mapa) e números do grupo |
| `/hall` | os 16 recordes, em dois recortes alternáveis |
| `/jornal` | seleção por jogador e perfil de carreira |
| `/jogadores/[ref]` | perfil individual |
| `/partidas/[id]` | detalhe de uma partida |
| `/criterios` | como cada número é calculado |

## Os dados são sintéticos

`apps/web/src/fixtures/*.json` são **fixtures anonimizadas**. Saíram de
respostas reais da API e passaram por substituição: apelidos, SteamIDs e
identificadores de partida viraram valores inventados (`Bagre`, `Rajada`,
`Pivete`…). Os números são reais, mas não há como ligá-los a ninguém.

No projeto de verdade, `src/lib/api.ts` assina cada requisição com HMAC e
chama um Cloudflare Worker. Aqui ele só lê os JSONs locais. **É a única
diferença de comportamento** entre este espelho e o site real.

## O que foi deliberadamente deixado de fora

Coletor de demos, API, esquema do banco, integração com a Steam, documentação
de arquitetura e os testes. Nada disso influencia design, e manter fora reduz a
superfície exposta.

## Onde o design pode melhorar

Pontos que já incomodam e onde uma proposta visual é bem-vinda:

- **A home** (`/`) e o **Jornal** ainda usam o cabeçalho de texto antigo. A
  identidade HALL só foi aplicada em `/hall`; as outras telas destoam.
- **Quatro selos alternativos estão sem uso.** A pasta tem 21 arquivos para 16
  recordes: cinco recordes ganharam duas versões de selo, e `lib/selos.ts` só
  escolhe uma. Sobram `economia-de-bala--1-bala-basta`,
  `garcom-de-ouro--serviu-no-prato`, `nunca-abriu--sempre-atras` e
  `vendeu-caro--serviu-a-vida`.
- **O PNG compartilhado não usa as ilustrações.** Na tela, o card mostra a arte
  de `assets/ilustracoes/`; no canvas, cai no desenho vetorial de
  `packages/card/src/ilustracoes.ts`, que é bem mais pobre. Compare
  `referencia/html/hall.html` com `referencia/cards/*.png` e a diferença fica
  evidente.
- **A pílula de filtro no Hall é placeholder**, desenhada mas desligada.
- **Densidade no celular**: os cards foram desenhados pensando em duas colunas;
  abaixo de `md` tudo vira uma coluna longa.
- **O card compartilhável é 1200×700 fixo.** Formato de feed e story pedem
  outras proporções, que ainda não existem.
