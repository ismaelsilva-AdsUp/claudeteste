---
name: report-monetizacao-site
description: Monta o report diário de monetização por site, no formato [MONETIZAÇÃO] · [Dia] · [DD/MM], com tabela de RPMS, eCPM, Requests, FR e MR contra meta em D0, D-1 e D-2, mais Cenário, Gargalo, Ações do dia e Top 10 anunciantes por impressões. Dados no Mesh (preferencial) e no GAM para anunciantes. Acione quando o pedido for "monta o report do <site>", "report de monetização", "faz o diário do oguiadocredito", "top 10 anunciantes", ou quando o operador citar um site e pedir o post do dia. Entrega no chat; publica em Doc do ClickUp só se pedirem. Responde em PT-BR.
---

# Report de monetização por site

Monta o post diário de um site. Entrega **no chat**, pronto para colar no Slack ou publicar em Doc do ClickUp.

Diferente da `report-diario-monetizacao`, que é por source de um squad. Esta é **por site**, com o bloco de anunciantes no fim.

## Regras que não se quebram

1. **A data vem do calendário.** Rodar `date` antes de montar D0, D-1 e D-2. Nunca usar a data máxima do dado.
2. **Conferir se D-1 consolidou no GAM antes de qualquer coisa.** Se não consolidou, parar e avisar. Ver Checagem obrigatória.
3. **Nunca inventar número.** Se falta métrica, escrever que falta. Nunca preencher célula por estimativa.
4. **D0 é parcial.** Sempre marcar como parcial. Comparar D0 com fechamento de D-1 não é comparação.
5. **Cenário, Gargalo e Ações são do operador.** A skill propõe rascunho a partir do dado, mas quem decide é ele. Nunca inventar decisão de negócio nem dono de gargalo.
6. **Confirmar a meta do mês antes de farolizar.** Meta velha inverte todo o farol sem avisar. Ver Metas.
7. **Filtrar sempre por domínio.** Sem filtro de `domain`, a query traz a rede inteira.
8. **Não escrever no ClickUp nem postar no Slack sozinha.** Doc só com OK, Slack só como rascunho.

## Escopo

Um site por vez. O operador diz qual. Exemplo do formato validado: `oguiadocredito.com`.

Três colunas de dado: **D0** (hoje, parcial), **D-1** e **D-2**.

**Na segunda, abrir quatro colunas:** D0, domingo, sábado e sexta. Sem isso o fim de semana desaparece do histórico. A leitura de referência é o domingo, que é o último dia fechado.

## Metas

**Perguntar ou confirmar antes de rodar.** As metas dos dois posts de referência não batem entre si:

| Métrica | Post de 20/08 | Post de 21/08 |
|---|---|---|
| RPMS | $100 | $150 |
| eCPM | $90 | $100 |
| MR | 70% | 70% |

Ou a meta subiu no dia, ou um dos dois está com número velho. Como a meta é o denominador de todo farol, **não assumir**: pedir a meta vigente do mês ao operador na primeira vez do mês, e reusar depois dentro da mesma conversa.

`Requests` e `FR` não têm meta. Entram sem farol.

## Métricas e fórmulas

| Métrica | Fórmula | Fonte |
|---|---|---|
| RPMS | `gam_revenue / sessions * 1000` | GAM + analytics |
| eCPM | `gam_revenue / gam_ad_impressions * 1000` | GAM |
| Requests | `gam_ad_requests` | GAM |
| FR | `gam_ad_impressions / gam_ad_requests * 100` | GAM |
| MR | `gam_responses_served / gam_ad_requests * 100` | GAM |

O RPMS é o único que cruza duas fontes: receita do GAM sobre sessão do analytics. As outras quatro saem todas de `gam_report_daily_domain`.

**Cuidado com o denominador do RPMS neste report.** Como aqui o grão é o site inteiro, ele soma sources de aquisição com sources de retenção, e a `session_starts` das sources de aquisição está quebrada na origem. Para checar, rodar na fact a razão `unique_sessions / session_starts`: **acima de 1,5** é sinal de sessão quebrada, e nas sãs fica entre 1,0 e 1,2. No oguiadocredito.com em 19 a 24/08/2026 ficou entre 1,09 e 1,16, ou seja saudável.

Se a razão estourar 1,5, avisar na nota de rodapé e oferecer a versão em **uRPMS**. Nunca trocar a métrica em silêncio, e nunca misturar as duas na mesma coluna sem rótulo.

## Farol

🟢 igual ou acima de 100% da meta · 🟡 85% a 99% · 🔴 abaixo de 85%.

Aplicar a **mesma** regra em todas as linhas com meta, inclusive na coluna D0. Os posts de referência foram feitos à mão e têm farol inconsistente (RPMS a 58% da meta marcado 🟡, MR a 96% marcado 🟢). Esta skill normaliza pela regra. Se a convenção real do time for outra, é uma linha para trocar aqui.

O cabeçalho leva os três emojis como legenda, sempre: `🔴 🟡 🟢`.

## Fontes

### Checagem obrigatória

Antes de tudo, confirmar que D-1 fechou:

```sql
SELECT date, round(sum(gam_revenue),2) AS rev, toUInt64(sum(gam_ad_requests)) AS req
FROM gam_report_daily_domain FINAL
WHERE date >= today() - 5 AND domain = '<site>'
GROUP BY date ORDER BY date
```

Se a receita de D-1 estiver muito abaixo dos dias anteriores, **parar e avisar**. GAM atrasado é o cenário que mais parece queda real sem ser: o denominador está completo e o numerador não, então RPMS despenca sozinho.

### Query principal (Mesh)

**Duas queries, e a fonte importa.** Validado em 24/08/2026 contra os posts publicados de 19, 20 e 21/08: esta combinação reproduz os números na segunda casa decimal.

O lado de anúncio vem de `gam_report_daily_domain FINAL`:

```sql
SELECT date,
       toUInt64(sum(gam_ad_requests))                                       AS req,
       toUInt64(sum(gam_ad_impressions))                                    AS imp,
       round(sum(gam_revenue),2)                                            AS rev,
       round(sum(gam_responses_served)/nullif(sum(gam_ad_requests),0)*100,2) AS mr,
       round(sum(gam_ad_impressions)/nullif(sum(gam_ad_requests),0)*100,2)   AS fr,
       round(sum(gam_revenue)/nullif(sum(gam_ad_impressions),0)*1000,2)      AS ecpm
FROM gam_report_daily_domain FINAL
WHERE date >= 'D-2' AND date <= 'HOJE' AND domain = '<site>'
GROUP BY date ORDER BY date
```

A sessão, que é o denominador do RPMS, vem de `vw_analytics_by_domain_source`:

```sql
SELECT date, toUInt64(sum(sessions)) AS sessions, toUInt64(sum(unique_users)) AS users
FROM vw_analytics_by_domain_source
WHERE date >= 'D-2' AND date <= 'HOJE' AND domain = '<site>'
GROUP BY date ORDER BY date
```

`RPMS = rev / sessions * 1000`, calculado fora do SQL com os dois resultados.

**NÃO usar `vw_fact_content_metrics_by_domain_channel_source` para esta tabela.** Ela diverge do GAM em parte dos dias: em 19/08/2026 devolveu 226.793 requests e RPMS de $154,10 contra 196.080 e $135,47 da fonte certa, uma diferença de 14% no volume e 14% no RPMS. Em outros dias as duas batem, o que é pior, porque o erro é intermitente e não aparece sempre. Use a fact só para quebra por `channel_source` dentro do Cenário, nunca para a tabela.

**Views de apoio:** `gam_report_daily_domain_channel_source FINAL` para a quebra por source, com a ressalva abaixo; `gam_report_daily_domain_adunit_channel_source FINAL` para impressão por bloco.

### Armadilhas do Mesh

- Views `vw_*` **rejeitam `FINAL`**; tabelas físicas **exigem** `FINAL`, senão a receita infla.
- Ordem certa é `FROM tabela AS x FINAL`, não `FROM tabela FINAL AS x`.
- **Alias igual ao nome da coluna quebra a agregação.** Usar `AS tot_revenue`, nunca `AS revenue`.
- A palavra `SYSTEM` no SQL é bloqueada.
- Sem filtro de `domain`, a query traz a rede inteira.
- Na fact, `domain` é o **hostname**, não o apex. Para casar com relatório do GAM por apex, juntar por `site_name`.
- **`channel_name` conta o site duas vezes.** Em `gam_report_daily_domain_channel_source` o campo mistura duas famílias de chave: existe a linha `sqd=adsup_br1`, que é o site inteiro, e existem as linhas `utm_source=*`, que somam o mesmo site. Somar todos os `channel_name` dobra o total: em 21/08/2026 deu 422.845 requests num dia de 196.080. Filtrar `channel_name LIKE 'utm_source=%'` para a quebra por source, ou `channel_name LIKE 'sqd=%'` para o total, **nunca os dois juntos**.
- Também existe uma segunda network no mesmo domínio, `22277837561`, com volume residual de dezenas de requisições. Não muda o número, mas aparece se você agrupar por `network_code`. A nossa é `22002220734`.

### Top 10 anunciantes (GAM)

Por padrão, sobre o **último dia fechado**, com a data explícita no título. Mix de anunciante em dia parcial é ruído: numa segunda às 7h o site inteiro tem 2.005 impressões.

Os posts de referência usam **D0 no horário do post**. Dá para ver no de 21/08, onde o Be Growth aparece com 2.329 impressões contra 53.678 do dia fechado. Se o operador preferir manter D0, é ele que pede, e a data no título muda junto.

1. Confirmar o `networkCode` do domínio em `dim_sites` antes de rodar. A maioria dos domínios está em FDR|GRIDMIDIA (`22002220734`), mas domínio de outra squad fica em rede própria.
2. `gam_run_custom_report` com dimension `CLASSIFIED_ADVERTISER_NAME` (junto com `AD_UNIT_NAME` só quando o operador quiser a quebra por bloco).
3. Métricas validadas nessa dimensão, use exatamente estas quatro: `AD_EXCHANGE_IMPRESSIONS`, `AD_EXCHANGE_AVERAGE_ECPM`, `AD_EXCHANGE_CTR`, `AD_EXCHANGE_REVENUE`.
4. **`AD_REQUESTS` não funciona com anunciante.** Testado em 24/08/2026 nas duas formas, com cinco métricas e com ela sozinha: as duas voltam `REPORT_ERROR_CONSTRAINTS_INCOMPATIBILITY`. Ou seja, **não existe coluna Req por anunciante neste relatório**. Se o operador pedir, dizer que não sai daqui em vez de improvisar. O mesmo vale para `PROGRAMMATIC_MATCH_RATE`.
5. **Não pedir `AD_EXCHANGE_MATCH_RATE` nessa dimensão.** Ela volta 100% em todos os anunciantes, porque no grão do anunciante só existe quem já ganhou o leilão. Número sem significado na tabela.
6. Filtros: `{"fieldName":"SITE","values":["<site>"],"not":false}` e, quando for por source, `{"fieldName":"CHANNEL","operation":"CONTAINS","values":["utm_source=<source>"]}`.
7. Ordenar por impressões, cortar em 10. Conferir o total do `summary` contra a receita do dia em `gam_report_daily_domain`: em 21/08/2026 deu $10.742,55 contra $10.742,83, o que valida a chamada.

Quando o operador quiser causa de queda, rodar D-1 e D-2 em chamadas separadas de um dia cada e comparar participação: anunciante que **saiu** ou **caiu de participação** é candidato a causa.

## Estrutura do post

```
[MONETIZAÇÃO]  · [<Dia da semana>] · [DD/MM] 🔴 🟡 🟢

Site: <site>

| MÉTRICA | META | DD/MM (D0) | DD/MM (D-1) | DD/MM (D-2) |
| ---| ---| ---| ---| --- |
| RPMS | $150 | $86,37 🔴 | $133,40 🟡 | $135,49 🟡 |
| eCPM | $100 | $85,36 🔴 | $87,47 🟡 | $87,32 🟡 |
| Requests |  | 7.156 | 172.419 | 196.066 |
| FR |  | 45,40% | 42,86% | 41,16% |
| MR | 70% | 79,23% 🟢 | 67,35% 🟡 | 65,14% 🔴 |

Cenário:
<duas ou três frases: o que aconteceu ontem, o que muda hoje, e mudança de escopo se houver>

Gargalo:
* Próxima ação: <o que precisa> | custo de não resolver hoje: <impacto> | Task: <link>

Ações para hoje (ordem de prioridade):
1. <ação em imperativo>
2. <ação em imperativo>

🏆 Top 10 Anunciantes por Impressões — DD/MM

📊 <Nome do site>

1º <Anunciante>
 ¬ Impressões: 53.678 | eCPM: $117,18 | CTR: 58,04% | Receita: $6.289,96

2º <Anunciante>
 ¬ Impressões: 14.586 | eCPM: $84,98 | CTR: 49,22% | Receita: $1.239,50

cc: @Jader Peterson @Terry Damasio @Marcillio - AdOps Pleno InCred
```

Preencher a data real em cada coluna, no lugar de `DD/MM`. Nota de rodapé quando D0 for parcial, quando a razão de sessão estourar 1,5, ou quando alguma métrica vier de fonte alternativa.

## Cenário, Gargalo e Ações

Estes três blocos são de decisão, não de dado. A skill entra assim:

**Cenário.** Propor rascunho de duas ou três frases a partir do que o dado mostra, sempre com o número ao lado. Registrar mudança de escopo que o operador mencionar, tipo source nova entrando no projeto, porque isso explica variação depois.

**Gargalo.** Uma linha no formato do modelo. Se não existe gargalo, escrever "sem gargalo hoje" em vez de inventar. Se o dono não é monetização, dizer de quem é. Sem link de task, marcar `[ falta link ]`.

**Ações para hoje.** Imperativo direto, ordenadas por prioridade, no máximo três. Ação de preço só quando o problema é de preço: eCPM subindo com MR e FR caindo é piso acima da demanda; MR e eCPM subindo juntos é demanda que mudou, não regra; RPMS caindo com receita subindo é denominador, não preço.

## Publicar em Doc do ClickUp

Só com OK do operador. Usar `clickup_create_document_page` ou `clickup_update_document_page` com `content_format: "text/md"`. O parser do ClickUp é sensível, então seguir exatamente:

1. **Tabela** em markdown GFM, com a linha separadora obrigatória: `| ---| ---| --- |`.
2. **Títulos** com `##` no principal e `###` nas subseções. Divisor visual é uma linha só com `/`.
3. **Menção a pessoa** precisa do ID numérico: `[@Nome da Pessoa](#user_mention#ID)`. Sem o ID a menção fica texto solto. IDs do cc padrão: Jader Peterson `88431736`, Terry Damasio `260674055`, Marcillio `254540229`.
4. **Link de task** é o que mais quebra. O formato que funciona é escapar os colchetes e repetir a URL como texto do link:
   `\[Nome da Task\] ([https://app.clickup.com/t/XXXX](https://app.clickup.com/t/XXXX))`
5. **Listas aninhadas** com `*` e 4 espaços por nível.
6. **Emoji de farol** é caractere direto na célula, sem markup.

Não inventar outro formato. Antes de criar página nova num doc que já existe, ler uma página publicada com `clickup_get_document_pages` em `content_format: "text/md"` e copiar o padrão em uso.

## Convenções de número

Formato **PT-BR**: ponto no milhar, vírgula no decimal. `$135,49`, `196.066 requests`, `41,16%`.

- Moeda com `$` e duas casas.
- Taxa com duas casas e `%`.
- Diferença entre duas taxas em **pontos percentuais**, escrita `pp`. Nunca dizer que "o MR caiu 5,62%" quando a diferença é de pontos.
- Variação relativa com uma casa e sinal: `+28,3%`.
- Data em `DD/MM` no texto.

## Estilo

- Sem travessão. Sem tom de IA. Termo importante em negrito.
- Sempre "RPMS", nunca "mRPMS". Sempre "FR", nunca "Fill Rate".
- Uma frase por ideia. Não empilhar três números na mesma frase.
- Só o que está fora da meta merece comentário, sempre com a meta ao lado.

## Fora do escopo

- Report por source de squad, que é a `report-diario-monetizacao`
- Follow-up de task, que é a `followup-clickup`
- Mudar regra de preço, criar bloco ou mexer em campanha
- Postar no Slack ou escrever no ClickUp sem OK

## Checklist antes de entregar

1. Rodei `date` e ancorei D0, D-1 e D-2.
2. Confirmei que D-1 consolidou no `gam_report_daily_domain`.
3. Confirmei a meta vigente do mês com o operador.
4. Filtrei por domínio.
5. Tirei a tabela de `gam_report_daily_domain` mais `vw_analytics_by_domain_source`, **não** da fact.
6. Usei `FINAL` nas tabelas físicas e não usei nas views. Nenhum alias igual ao nome da coluna.
7. Conferi a razão `unique_sessions / session_starts` e avisei se passou de 1,5.
8. Farol pela regra 100/85, igual em todas as linhas.
9. D0 marcado como parcial, com a hora e o percentual do volume de um dia cheio.
10. Top 10 com as quatro métricas `AD_EXCHANGE_*` validadas, sem `AD_REQUESTS` e sem match rate, com a data no título e o total conferido contra a receita do dia.
11. Cenário, Gargalo e Ações escritos como rascunho para o operador revisar, sem decisão inventada.
12. Se publiquei em Doc, usei as convenções de markdown do ClickUp e a menção com ID numérico.
