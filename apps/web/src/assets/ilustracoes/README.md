# Ilustrações dos cards

Solte aqui um arquivo por prêmio/recorde, nomeado com a **chave** exata. O card
passa a usar a imagem automaticamente — nenhuma mudança de código.

| Arquivo | Onde aparece |
|---|---|
| `passeio-no-mapa.webp` | Hall da Vergonha — menor dano por round |
| `entregou-o-corpo.webp` | Hall da Vergonha — mortes por round |
| `abriu-o-round.webp` | Hall da Vergonha — primeira morte do time |
| `inimigo-interno.webp` | Hall da Vergonha — dano em aliados |
| `cegou-os-proprios.webp` | Hall da Vergonha — flash amiga |
| `carregou-sozinho.webp` | Hall da Fama — maior dano por round |
| `colheita.webp` | Hall da Fama — abates por round |
| `sobreviveu-a-tudo.webp` | Hall da Fama — menor taxa de mortes |

Extensões aceitas: `.webp`, `.png`, `.jpg`, `.avif`. Sem arquivo, o card cai na
arte desenhada em código — nunca fica sem imagem.

**Formato:** 4:3 (ex. 1024×768), que é a proporção da miniatura no card.

**Peso:** até ~200 KB cada em `.webp`. O card inteiro vira PNG no
compartilhamento, e imagem pesada atrasa isso no celular.

Os nomes das chaves saem de `packages/metrics/src/hall.ts` (`record_id`). Para
prêmios do Jornal, a chave é o `award_id`.
