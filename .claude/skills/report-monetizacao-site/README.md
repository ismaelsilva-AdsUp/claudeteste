# report-monetizacao-site

Monta o post diário de monetização de um site, no formato `[MONETIZAÇÃO] · [Dia] · [DD/MM]`, com a tabela de métricas contra meta e o Top 10 de anunciantes no fim.

## O que é

Uma skill do Claude Code que puxa o dado do Mesh, o anunciante do GAM, e devolve o post pronto para colar. Ela cobre a parte que é dado e cálculo. Cenário, Gargalo e Ações continuam sendo seus, ela só monta o rascunho.

É por **site**, com anunciantes. Não confundir com a `report-diario-monetizacao`, que é por **source** de um squad. As duas convivem.

## Como instalar

Arquivo único, `SKILL.md`, sem dependência:

- Só para você: `~/.claude/skills/report-monetizacao-site/SKILL.md`
- Só no projeto: `.claude/skills/report-monetizacao-site/SKILL.md`
- Para o time: interface de habilidades da organização

Requisitos: **MCP Frontier Mesh** (a tabela), **MCP Frontier GAM** (o Top 10). ClickUp só se você for publicar em Doc.

## Como usar

Só pedir, dizendo o site:

- "monta o report do oguiadocredito"
- "report de monetização do <site>"
- "faz o diário e o top 10 de anunciantes"

Para forçar: `/report-monetizacao-site oguiadocredito.com`.

O site é a única coisa obrigatória. Na primeira vez do mês ela pergunta a meta, porque meta velha inverte o farol inteiro sem avisar.

## O que ela entrega

O post completo, na ordem do modelo: cabeçalho com a legenda dos faróis, `Site:`, a tabela de RPMS, eCPM, Requests, FR e MR em D0, D-1 e D-2 com o farol contra a meta, depois Cenário, Gargalo, Ações para hoje, o Top 10 de anunciantes por impressões, e o `cc:`.

Se quiser, publica também em página de Doc do ClickUp, com a formatação que o parser deles aceita.

## Como ela funciona, em sete passos

1. Roda `date` e ancora D0, D-1 e D-2 no calendário, nunca na data máxima do dado.
2. **Confere se D-1 consolidou no GAM.** Se não fechou, ela para e avisa em vez de montar report falso.
3. Puxa o lado de anúncio de `gam_report_daily_domain` e a sessão de `vw_analytics_by_domain_source`.
4. Calcula: RPMS sobre sessão, eCPM sobre impressão, FR e MR sobre requisição.
5. Farol contra a meta do mês, mesma regra em todas as linhas.
6. Puxa o Top 10 de anunciantes no GAM sobre o dia de hoje.
7. Monta o post e devolve no chat, com Cenário, Gargalo e Ações como rascunho para você revisar.

O passo 2 é o menos óbvio e o mais importante. Quando o GAM atrasa a consolidação, a sessão está completa e a receita não, então o RPMS despenca e parece queda real.

## Os gotchas que ela resolve

Os quatro primeiros foram descobertos rodando a skill de verdade em 24/08/2026 e conferindo contra os posts publicados de 19, 20 e 21/08. Sem essa conferência eu teria entregue números 14% errados com cara de certos.

- **A fonte certa é `gam_report_daily_domain`, não a fact.** `vw_fact_content_metrics_by_domain_channel_source` diverge do GAM em parte dos dias: em 19/08 devolveu 226.793 requests e RPMS de $154,10 contra 196.080 e $135,47 da fonte certa, e o post publicado dizia $135,49. Em outros dias as duas batem, o que é pior, porque o erro é intermitente.
- **`channel_name` conta o site duas vezes.** O campo mistura a chave `sqd=adsup_br1`, que é o site inteiro, com as chaves `utm_source=*`, que somam o mesmo site. Somar tudo dobra: 422.845 requests num dia de 196.080. Filtrar uma família só.
- **`AD_REQUESTS` não funciona com anunciante no GAM.** Testado nas duas formas, com cinco métricas e sozinha, e as duas voltam `REPORT_ERROR_CONSTRAINTS_INCOMPATIBILITY`. Não existe coluna Req por anunciante nesse relatório, e a skill diz isso em vez de improvisar.
- **`AD_EXCHANGE_MATCH_RATE` por anunciante volta 100% sempre**, porque nesse grão só existe quem ganhou o leilão. Número sem significado, fica fora da tabela.
- **Views `vw_*` rejeitam `FINAL`, tabelas físicas exigem.** Sem `FINAL` na tabela física a receita infla. Com `FINAL` na view, a query quebra.
- **Alias igual ao nome da coluna quebra a agregação.** `AS tot_revenue`, nunca `AS revenue`.
- **Ordem é `FROM tabela AS x FINAL`**, não `FROM tabela FINAL AS x`.
- **Sem filtro de `domain` a query traz a rede inteira.**
- **A palavra `SYSTEM` no SQL é bloqueada.**
- **`domain` na fact é hostname, não apex.** Para casar com relatório do GAM por apex, juntar por `site_name`.
- **No GAM, só as quatro métricas `AD_EXCHANGE_*` validadas.** São `AD_EXCHANGE_IMPRESSIONS`, `AD_EXCHANGE_AVERAGE_ECPM`, `AD_EXCHANGE_CTR` e `AD_EXCHANGE_REVENUE`. `AD_REQUESTS` e `PROGRAMMATIC_MATCH_RATE` fazem a API rejeitar a chamada.
- **Confirmar o `networkCode` do domínio em `dim_sites` antes de rodar.** A maioria está em FDR|GRIDMIDIA (22002220734), mas domínio de outra squad fica em rede própria.
- **RPMS de site inteiro herda a `session_starts` quebrada das sources de aquisição.** Ela checa a razão `unique_sessions / session_starts`: acima de 1,5 é sinal de sessão quebrada, e aí ela avisa e oferece a versão em uRPMS. Nunca troca a métrica em silêncio.
- **Publicar tabela em Doc do ClickUp exige markdown GFM com a linha separadora**, menção com `[@Nome](#user_mention#ID)` e link de task com colchete escapado. Sem isso a menção fica texto solto e o link não linka.

## Convenções fechadas pelo operador em 24/08/2026

Duas coisas que eu tinha assumido errado e que ficaram decididas:

1. **Top 10 é sempre do dia de hoje, D0.** Não é dia fechado. O bloco é retrato do mix de anunciante da manhã, para decidir preço agora. O volume pequeno é esperado: no post de 21/08 o Be Growth aparece com 2.329 impressões contra 53.678 do dia inteiro, e isso não é erro de coleta nem precisa de ressalva.
2. **A tabela é sempre D0, D-1 e D-2 de calendário.** Ontem é ontem, mesmo que ontem seja domingo. Numa segunda, D-1 é domingo e D-2 é sábado. Sem substituir por sexta e sem abrir quarta coluna.

## Uma decisão que continua minha, e você pode reverter

**Farol normalizado pela regra 100/85.** No post de 21/08 o RPMS a 58% da meta está marcado 🟡, e o MR a 96% está 🟢. Aplicando a regra 🟢 ≥100% / 🟡 85–99% / 🔴 <85%, viram 🔴 e 🟡. A skill aplica a regra igual em todas as linhas, inclusive em D0. Se a convenção real for outra, tipo D0 sem farol ou meta pro-rata na coluna parcial, me diz e eu ajusto.

## Um terceiro ponto que precisa da sua resposta

**As metas dos dois posts não batem:** em 20/08 RPMS $100 e eCPM $90, em 21/08 RPMS $150 e eCPM $100, um dia depois. Ou a meta subiu, ou um dos dois estava com número velho. Como a meta é o denominador de todo farol, a skill pergunta em vez de assumir. Se você me passar a meta vigente de agosto por site, eu deixo fixa no MD e ela para de perguntar.

## O que ela nunca faz

- Não inventa número. Se falta métrica, ela diz que falta
- Não monta report sobre D-1 não consolidado
- Não inventa decisão de negócio. Cenário, Gargalo e Ações saem como rascunho
- Não escreve no ClickUp nem posta no Slack sem OK
- Não mexe em regra de preço, bloco ou campanha

## Limites que valem saber

- **As metas envelhecem dentro da skill.** Virou o mês, alguém atualiza, senão o farol sai contra a régua antiga.
- **Um site por vez.** Para vários, é uma chamada por site. Isso é de propósito: report de dois sites na mesma tabela mistura performance.
- **Ela monta quando alguém pede.** Rodar sozinha toda manhã é rotina separada, e seguindo o que o time combinou, a rotina só aponta para cá: "monta o report do oguiadocredito e posta como rascunho". A lógica fica toda aqui no MD.
