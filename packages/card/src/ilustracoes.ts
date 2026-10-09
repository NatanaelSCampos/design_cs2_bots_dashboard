/**
 * Ilustrações do card, desenhadas à mão como caminhos SVG.
 *
 * Por que caminho SVG e não imagem: `Path2D` aceita string `d` tanto no
 * navegador quanto no `@napi-rs/canvas` (verificado em 2026-10-07). Então a
 * mesma cena é autorada uma vez e renderizada igual nos dois hosts — o PNG do
 * Discord e o PNG que a pessoa compartilha saem idênticos.
 *
 * Por que desenhada à mão e não gerada: arte gerada por semente não consegue
 * ser engraçada. Piada precisa de intenção. Cada cena aqui foi escolhida para
 * o arquétipo do prêmio.
 *
 * Todas as cenas vivem num quadrado 0 0 100 100, com traço pensado para 4px de
 * espessura nesse espaço. Nenhuma codifica dado: são ilustração, não gráfico.
 */

export interface Cena {
  /** Formas preenchidas, desenhadas antes do traço. */
  preenchidos?: string[];
  /** Traços, desenhados por cima. */
  tracos: string[];
  /** Detalhes finos (olhos, marcas), traço mais fino. */
  detalhes?: string[];
  /** Descrição curta, para `alt` e para quem lê o código. */
  descricao: string;
}

/**
 * O turista: óculos escuros e câmera enorme, passeando em vez de jogar.
 *
 * Todas as cenas foram redesenhadas em 2026-10-07 depois de olhar o PNG: a
 * primeira versão usava palitos de traço fino e virava rabisco em 360px.
 * Silhueta grossa com poucas formas grandes lê; linha fina com muitos detalhes
 * não lê. O traço aqui é pensado para 8px no espaço 0–100.
 */
const TURISTA: Cena = {
  descricao: "Uma câmera fotográfica de turista, com flash disparando",
  preenchidos: [
    // Corpo da câmera, grande e fechado
    "M 14 38 h 72 v 46 h -72 Z",
    // Saliência da lente
    "M 36 30 h 28 v 10 h -28 Z",
    // Flash em cima
    "M 70 24 h 14 v 10 h -14 Z",
  ],
  tracos: [
    // Lente, dois anéis
    "M 50 61 m -17 0 a 17 17 0 1 0 34 0 a 17 17 0 1 0 -34 0",
    "M 50 61 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0",
    // Raios do flash
    "M 77 18 L 77 8 M 88 20 L 96 13 M 66 20 L 58 13",
  ],
};

/** O corpo no chão com contorno de giz. */
const CORPO_NO_CHAO: Cena = {
  descricao: "Uma lápide com uma cruz, fincada no chão",
  preenchidos: [
    // Lápide: topo arredondado sobre base reta
    "M 28 36 a 22 22 0 0 1 44 0 L 72 84 L 28 84 Z",
    // Chão
    "M 10 84 h 80 v 10 h -80 Z",
  ],
  tracos: [
    // Cruz, grossa e centralizada
    "M 50 32 L 50 70",
    "M 36 46 L 64 46",
  ],
  detalhes: [
    // Tufo de grama de cada lado
    "M 18 84 l -4 -8 M 84 84 l 4 -8",
  ],
};

/** A granada caindo no pé do próprio time. */
const GRANADA_NO_PE: Cena = {
  descricao: "Uma granada com a alavanca solta e linhas de impacto",
  preenchidos: [
    // Corpo da granada, grande e centralizado
    "M 48 54 m 0 -22 a 22 26 0 1 0 0.1 0 Z",
    // Topo chato
    "M 36 26 h 24 v 8 h -24 Z",
  ],
  tracos: [
    // Alavanca, reta e colada no corpo, sem virar gancho
    "M 60 30 L 76 34 L 74 52",
    // Anel do pino, solto e longe
    "M 86 16 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0",
    // Linhas de impacto saindo da granada
    "M 18 34 L 6 28 M 14 54 L 2 54 M 18 74 L 6 80",
  ],
};

/** O clarão na cara do próprio time. */
const FLASH_NA_CARA: Cena = {
  descricao: "Um rosto ofuscado por um clarão, com as mãos na frente dos olhos",
  preenchidos: [
    // Cabeça grande
    "M 50 48 a 20 20 0 1 0 0.1 0 Z",
    // Mãos, duas formas sólidas cobrindo os olhos
    "M 30 44 h 16 v 11 h -16 Z",
    "M 54 44 h 16 v 11 h -16 Z",
  ],
  tracos: [
    // Raios do clarão, grossos e longos
    "M 50 20 L 50 4",
    "M 74 28 L 86 14",
    "M 26 28 L 14 14",
    "M 78 48 L 96 48",
    "M 22 48 L 4 48",
    // Tronco
    "M 50 68 L 50 92",
  ],
};

/** O rambo carregando o time nas costas. */
const CARREGANDO: Cena = {
  descricao: "Um haltere gigante erguido, dobrando a barra com o peso",
  preenchidos: [
    // Anilhas grandes dos dois lados
    "M 10 32 h 18 v 44 h -18 Z",
    "M 72 32 h 18 v 44 h -18 Z",
    // Anilhas menores por fora
    "M 2 42 h 8 v 24 h -8 Z",
    "M 90 42 h 8 v 24 h -8 Z",
  ],
  tracos: [
    // Barra arqueada pelo peso
    "M 28 48 Q 50 62 72 48",
    // Linhas de esforço
    "M 50 24 L 50 14 M 36 26 L 30 16 M 64 26 L 70 16",
  ],
};

/** A ceifa. */
const CEIFA: Cena = {
  descricao: "Uma foice grande sobre marcas de contagem",
  preenchidos: [
    // Lâmina, forma sólida e grande
    "M 56 10 Q 92 16 86 50 Q 80 28 56 26 Z",
  ],
  tracos: [
    // Cabo grosso
    "M 56 14 L 34 72",
    // Marcas de contagem, grossas
    "M 12 92 L 18 66",
    "M 26 92 L 32 66",
    "M 40 92 L 46 66",
    "M 8 80 L 50 74",
  ],
};

/** O sobrevivente atrás do escudo. */
const SOBREVIVENTE: Cena = {
  descricao: "Um escudo grande com um boneco protegido atrás",
  preenchidos: [
    // Escudo, dominando a cena
    "M 50 8 L 92 24 Q 92 70 50 94 Q 8 70 8 24 Z",
  ],
  tracos: [],
  detalhes: [
    // O boneco, desenhado por cima do escudo em tom claro
    "M 50 36 a 10 10 0 1 0 0.1 0 Z",
    "M 50 46 L 50 68",
    "M 50 52 L 38 60 M 50 52 L 62 60",
    "M 50 68 L 42 82 M 50 68 L 58 82",
  ],
};

/** O primeiro a cair. */
const PRIMEIRO_A_CAIR: Cena = {
  descricao: "Um cronômetro marcando poucos segundos, com a mira dentro",
  preenchidos: [
    // Botão e alças do cronômetro
    "M 42 6 h 16 v 10 h -16 Z",
  ],
  tracos: [
    // Caixa redonda, grossa
    "M 50 58 m -38 0 a 38 38 0 1 0 76 0 a 38 38 0 1 0 -76 0",
    // Ponteiro logo no começo da volta
    "M 50 58 L 50 26",
    "M 50 58 L 66 44",
    // Marcas das horas
    "M 50 16 L 50 24 M 88 58 L 80 58 M 50 96 L 50 88 M 12 58 L 20 58",
    // Alça lateral
    "M 78 24 L 86 16",
  ],
};

/** O perdido, padrão para prêmio sem cena própria. */
const PERDIDO: Cena = {
  descricao: "Um boneco sozinho com uma interrogação enorme acima",
  preenchidos: [
    "M 40 56 a 15 15 0 1 0 0.1 0 Z",
  ],
  tracos: [
    "M 40 71 L 40 90",
    "M 40 76 L 26 86 M 40 76 L 54 86",
    // Interrogação grande
    "M 68 28 Q 68 12 82 12 Q 94 12 94 26 Q 94 38 82 42 L 82 52",
  ],
  detalhes: ["M 82 62 l 0 3"],
};

/**
 * Catálogo. A chave é o `record_id` do Hall ou o `award_id` do Jornal.
 *
 * `PERDIDO` é o padrão: prêmio novo aparece com ilustração neutra em vez de
 * card sem imagem. Nunca escolhemos uma cena "parecida" por aproximação — isso
 * acabaria colocando o corpo no chão num prêmio de elogio.
 */
export const CENAS: Readonly<Record<string, Cena>> = {
  // Hall da Vergonha
  "passeio-no-mapa": TURISTA,
  "entregou-o-corpo": CORPO_NO_CHAO,
  "abriu-o-round": PRIMEIRO_A_CAIR,
  "inimigo-interno": GRANADA_NO_PE,
  "cegou-os-proprios": FLASH_NA_CARA,
  // Hall da Fama
  "carregou-sozinho": CARREGANDO,
  colheita: CEIFA,
  "sobreviveu-a-tudo": SOBREVIVENTE,
};

export const CENA_PADRAO = PERDIDO;

/**
 * Cena de uma chave, com fallback explícito.
 *
 * Também aceita a métrica como segunda tentativa, para prêmios de contraste do
 * Jornal, que não têm `record_id`.
 */
export function cenaDe(chave: string, metrica?: string): Cena {
  const porChave = CENAS[chave];
  if (porChave) return porChave;

  const porMetrica: Record<string, Cena> = {
    adr: CARREGANDO,
    kd: CEIFA,
    first_death_rate: PRIMEIRO_A_CAIR,
    team_damage_per_round: GRANADA_NO_PE,
    friendly_flash_per_round: FLASH_NA_CARA,
  };
  return (metrica ? porMetrica[metrica] : undefined) ?? CENA_PADRAO;
}
