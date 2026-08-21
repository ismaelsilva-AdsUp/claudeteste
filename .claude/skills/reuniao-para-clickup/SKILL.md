---
name: reuniao-para-clickup
description: Transforma o que ficou decidido numa reunião (Granola) ou numa thread do Slack em tarefas do ClickUp, em modo copilot. Acione quando o pedido for "vira as tarefas da daily", "joga os próximos passos no ClickUp", "abre as tasks da reunião de ontem", "transforma essa thread em task", ou quando o operador citar uma reunião e pedir follow-up. Nunca cria nada sem confirmação. Responde em PT-BR.
---

# Reunião para ClickUp

Fecha o ciclo entre o que foi combinado e o que existe no ClickUp. Modo **copilot**: monta a proposta, mostra, espera OK. Nunca cria, comenta ou muda status sem confirmação explícita.

O trabalho de valor aqui não é criar task, é **não criar task duplicada** e **acertar a lista, o dono e o Setor**. Errar isso gera board sujo, que é pior que não ter task.

## Regras que não se quebram

1. **Nunca criar, comentar ou mudar status sem OK explícito do operador.** Apresentar a proposta e esperar.
2. **Nunca inventar dono.** Se a ata não diz de quem é, perguntar. "Alguém" não é dono.
3. **Nunca inventar prazo.** Sem data na ata, propor sem `due_date` e sinalizar que falta.
4. **Deduplicar antes de propor.** Task repetida é o principal risco desta skill. Ver Deduplicação.
5. **Um item por task.** Se a ata junta duas coisas na mesma linha, separar.
6. **A data vem do calendário.** Rodar `date` antes de calcular prazo relativo tipo "até sexta".
7. **Slack só em rascunho.** Usar `slack_send_message_draft`, nunca `slack_send_message`. O operador revisa e envia.

## Fontes

**Granola (padrão).** `list_meetings` aceita só `this_week`, `last_week` e `last_30_days`. Depois `get_meetings` com o id, que já devolve o bloco **Próximos Passos** com dono entre parênteses. Ler só decisões e próximos passos. Discussão não vira task.

Reuniões recorrentes do operador: `Daily - AdsUp` (quase diária), `Análises com Claude`, `Criação de padronização de análise conjunta`, 1:1 no formato `Ismael <> Nome`.

**Slack (alternativa).** `slack_read_thread` na thread indicada. Em grupo de DM não existe canal pesquisável, o operador passa o link ou o contexto.

## Onde a task vai

### Espaço Adsup, folder Operação Adsup `90148423961`

| Lista | list_id |
|---|---|
| Squad BR01 | 901415252270 |
| Squad BR02 | 901415891357 |
| Squad MX | 901415890560 |
| Squad CO | 901415879984 |
| Squad FIN | 901418999024 |
| Tarefas Estruturais | 901419356954 |

`Squad FIN ` tem **espaço no fim do nome**. Resolver sempre por `list_id`, nunca por nome.

### Espaço Operação Incred `90030812604`

| Lista | list_id |
|---|---|
| Squad US 02 | 901414102090 |
| Squad US 01 | 901414818648 |
| Squad BR | 901414300713 |
| Squad ARG | 901415621108 |
| Squad BR Neo | 901417443400 |
| Squad US Neo | 901417465624 |
| Tarefas Estruturais - Monetização | 901417441517 |
| Tarefas Estruturais - Push | 901417441514 |
| Tarefas Estruturais - Email | 901417441503 |
| Tarefas Estruturais - Aquisição | 901417906481 |
| AdOps <> Content | 901416770670 |
| Gestão de Domínios (WP) | 901416351556 |

**Regra de roteamento:** ação que vale para um squad só vai na lista do squad. Ação de método, processo ou ferramenta que atravessa squads vai em Tarefas Estruturais do setor dono. Ação entre AdOps e Conteúdo vai em `AdOps <> Content`.

## Statuses mudam por espaço

Esta é a pegadinha que mais quebra chamada. O nome do status não é global:

- **Operação Adsup:** `backlog`, `a fazer`, `em progresso`, `revisão`, `impedimento`, `complete`
- **Lista pessoal Ismael** (`901418239583`, espaço Gente & Cultura): `to do`, `in progress`, `complete`
- Listas do espaço Operação Incred usam `concluído` no lugar de `complete` em parte das listas

Na dúvida, `clickup_get_task` com `expand_statuses: true` numa task da lista, ou `clickup_get_list`, e usar o nome exato. Omitir `status` no create é o mais seguro: a lista aplica o padrão dela.

## Campos e IDs

**Assignees são numéricos.** Resolver **por email**, nunca por nome. Vários nomes no workspace têm sufixo de cargo ou grafia diferente do email:

| Pessoa | Email para resolver | ID |
|---|---|---|
| Ismael | ismaelsilva@gridmidia.com | 290590392 |
| Milton Cruz | miltoncruz@gridmidia.com | 94425256 |
| Vinicius | viniciusoliveira@gridmidia.com | 88473521 |
| Arthur Fillipe | arthurfilipe@gridmidia.com | 88470167 |
| Anthony Alexandre | anthonyalexandre@gridmidia.com | 88325964 |
| Marcillio | marcillioangelo@gridmidia.com | 254540229 |
| Terry Damasio | terrydamasio@gridmidia.com | 260674055 |
| Jader Peterson | jader.peterson@gridmidia.com | 88431736 |
| Débora Ferreira | debora@gridmidia.com | 88322268 |

No ClickUp o Vinicius está cadastrado como **"Vinicius Oliveria"**, o Marcillio como **"Marcillio - AdOps Pleno InCred"**, e a Débora como **"Débora Ferreira | Coordenadora de Squad"**. Buscar por nome falha ou traz o registro errado. Por email sempre funciona.

**Setor** é campo de labels, id `7b622b27-b2fe-42d9-b9d0-960aaaf3286e`. O valor é **JSON array de UUID em string**, não o texto do label:

| Label | UUID |
|---|---|
| Monetização | a244496e-d7ea-42f7-a588-9e1b59604345 |
| Aquisição | a1269c4a-8432-4b55-b150-b4fb8e34e5f4 |
| Retenção | 87abd04f-8af1-4e7c-bf19-35f06ceda924 |
| Email | 8dfd6db4-573b-4ed2-a451-aadf3bf4ef60 |
| Push | 7a0925d7-b5bb-4724-88ea-5f9b9ee20e7b |
| Conteúdo | e71673dc-deae-492b-aae5-090c8e19fb10 |
| Tecnologia | 89748f9c-a536-4ee8-9c2d-6d7df93e5f46 |
| Dados | 7f8147db-3381-4950-891e-c3fbea2d7cfc |
| Coordenação | 88814c82-878b-4800-b216-3af677359169 |
| Operação | cc2601ce-56ad-45c8-9547-a64701c2d454 |

Exemplo: `{"id": "7b622b27-b2fe-42d9-b9d0-960aaaf3286e", "value": "[\"a244496e-d7ea-42f7-a588-9e1b59604345\"]"}`

**Líder técnico** é campo de users, id `719f745d-e1b3-4ae8-b309-a9c68418c9a5`, valor `{"add":["<id numérico>"]}`.

**Nunca tocar nos campos `BASELINE_*`.** São da feature de baselines do ClickUp, preenchidos pela ferramenta.

**Tags precisam existir no espaço antes.** `weekly-monetização` existe em Operação Incred. Tag nova falha silenciosa, então não inventar tag.

**`due_date` no create aceita `YYYY-MM-DD`.** A ferramenta converte. Não passar epoch.

## Deduplicação

Sem isso a skill polui o board. O board já tem o mesmo nome de task recorrente em quatro listas ao mesmo tempo, `[Monetização - Diária]` existe em BR01, BR02, MX e FIN, então busca por palavra-chave solta dá falso positivo garantido.

Ordem:

1. `clickup_search` com as palavras-chave do item, **com `filters.location.subcategories` na lista alvo**, e `task_statuses` sem `closed`.
2. Se achar task com o mesmo objetivo, **não criar nova.** Propor comentário na existente, com o que a reunião decidiu e a data.
3. Se achar task parecida mas de outro escopo, criar nova e propor link entre as duas.
4. `clickup_filter_tasks` e `clickup_search` paginam. Enquanto vier `has_more` ou `next_cursor`, continuar. Uma página só não é a resposta completa.

## Passo a passo

1. Rodar `date` e ancorar hoje.
2. Achar a reunião. Sem indicação do operador, usar a `Daily - AdsUp` mais recente.
3. Extrair só o que tem ação. Decisão sem ação vira contexto na descrição, não vira task.
4. Para cada item definir: lista alvo, dono, Setor, prazo, prioridade.
5. Deduplicar contra a lista alvo.
6. Montar a tabela de proposta e **parar**.
7. Depois do OK, criar só o que foi aprovado e devolver os links.
8. Se o operador pedir, montar o rascunho do follow-up no Slack.

## Formato da proposta

```
Reunião: <título> · <data> · <n> itens com ação

| # | Item da ata | Lista | Dono | Setor | Prazo | Ação |
|---|---|---|---|---|---|---|
| 1 | Isolar Inboxmidia em site separado | Squad ARG | Marcillio | Monetização | 2026-08-25 | criar |
| 2 | Compilar métricas de carregamento de bloco | Tarefas Estruturais - Monetização | Ismael | Monetização | falta prazo | criar |
| 3 | Padronizar nomenclatura de RPM e SPM | Tarefas Estruturais - Monetização | Ismael | Dados | 2026-08-28 | comentar em 86bb... |

Fora da proposta: <itens sem dono ou sem ação clara, com o motivo>
Confirma? Posso ajustar item por item.
```

Depois de criar, devolver a mesma tabela com a coluna de URL, e nada mais.

## Estilo

- Nome de task em **imperativo e específico**: "Isolar Inboxmidia em site separado no Guia Finanzzas", não "Inboxmidia".
- Descrição com três linhas: o que foi decidido, por que, e o link da reunião ou da thread.
- Sem travessão. Sem tom de IA. Data em `AAAA-MM-DD` no campo e `DD/MM` no texto.

## Fora do escopo

Se o operador pedir, dizer que é outra skill ou outro fluxo:

- Montar report diário de monetização, que é a `report-diario-monetizacao`
- Analisar queda de RPMS, MR ou eCPM, que é análise de dado, não follow-up
- Criar ou mexer em Doc, dashboard ou whiteboard do ClickUp
- Mudar status ou fechar task de outra pessoa
- Enviar mensagem no Slack por conta própria

## Checklist antes de entregar

1. Rodei `date`.
2. Li só decisões e próximos passos, não a discussão inteira.
3. Todo item tem dono real, resolvido por email.
4. Toda lista foi resolvida por `list_id`.
5. Deduplicei com filtro de lista, e paginei até o fim.
6. Setor foi passado como JSON array de UUID.
7. Não passei status, ou passei o nome exato do espaço certo.
8. Mostrei a proposta e esperei OK antes de criar qualquer coisa.
9. Item sem dono ou sem ação ficou de fora, com o motivo escrito.
