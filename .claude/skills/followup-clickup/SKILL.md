---
name: followup-clickup
description: Monta o digest de follow-up do ClickUp antes da daily ou da weekly: impedimentos, tasks paradas, sem dono, sem prazo, vencidas e recorrentes duplicadas, agrupadas por squad e ordenadas por prioridade. Acione quando o pedido for "monta o followup", "o que tá travado", "prepara a daily", "como tá meu board", "tasks paradas", "o que venceu", ou quando o operador pedir status das tarefas de um squad. Só leitura, nunca escreve no ClickUp sem OK. Responde em PT-BR.
---

# Follow-up ClickUp

Monta o bloco de FOLLOWUP da daily lendo o ClickUp. Entrega **no chat**, pronto para colar. Só leitura por padrão.

O valor não é listar task, é **separar o que precisa de decisão hoje do que é ruído de board**. Digest que lista tudo não é usado.

## Regras que não se quebram

1. **Só leitura por padrão.** Nunca mudar status, nunca comentar, nunca fechar task. Se o operador pedir para registrar algo, propor e esperar OK.
2. **A data vem do calendário.** Rodar `date` antes de calcular "parada há N dias" ou "venceu".
3. **Paginar até o fim.** `clickup_filter_tasks` devolve 100 por página. Enquanto `has_more` for true, chamar de novo com `next_page`. Uma página só não é o board.
4. **Nunca contar task fechada como pendência.** Ver Statuses, porque o nome de fechado muda por espaço.
5. **Recorrente duplicada não é bug, é desenho.** Ver Recorrentes. Não sugerir apagar.
6. **Nada de nome de pessoa como filtro.** Assignee é ID numérico, resolver por email.

## Escopo padrão

Sem indicação do operador, o escopo é **as tasks abertas onde ele é assignee**, nos squads do AdsUp, mais Tarefas Estruturais - Monetização.

| Lista | list_id | Espaço |
|---|---|---|
| Squad BR01 | 901415252270 | Adsup |
| Squad BR02 | 901415891357 | Adsup |
| Squad MX | 901415890560 | Adsup |
| Squad CO | 901415879984 | Adsup |
| Squad FIN | 901418999024 | Adsup |
| Tarefas Estruturais | 901419356954 | Adsup |
| Tarefas Estruturais - Monetização | 901417441517 | Operação Incred |
| Tarefas Estruturais - Push | 901417441514 | Operação Incred |
| AdOps <> Content | 901416770670 | Operação Incred |
| Gestão de Domínios (WP) | 901416351556 | Operação Incred |
| Ismael (pessoal) | 901418239583 | Gente & Cultura |

`Squad FIN ` tem **espaço no fim do nome**, então resolver por `list_id`, nunca por nome.

Se o operador pedir de outra pessoa ou de um squad só, restringir. Se pedir "do time", passar todos os IDs de assignee do grupo.

## Pessoas

Resolver **por email**, nunca por nome:

| Pessoa | Email | ID |
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

No ClickUp o Vinicius está como **"Vinicius Oliveria"**, o Marcillio como **"Marcillio - AdOps Pleno InCred"**, a Débora como **"Débora Ferreira | Coordenadora de Squad"**. Busca por nome falha ou traz registro errado.

## Statuses mudam por espaço

O nome do status **não é global**. Isso decide o que conta como pendência:

- **Operação Adsup:** `backlog`, `a fazer`, `em progresso`, `revisão`, `impedimento`, `complete`
- **Lista pessoal Ismael:** `to do`, `in progress`, `complete`
- **Operação Incred:** parte das listas usa `concluído` no lugar de `complete`

`impedimento` só existe no Adsup, e é o status mais importante deste digest.

Na dúvida, `clickup_get_list` para pegar os statuses reais da lista, ou `clickup_get_task` com `expand_statuses: true`. Não chutar.

## As seis leituras do digest

Nesta ordem. A ordem é a prioridade.

**1. Impedimento.** Status `impedimento`. Toda task aqui entra, sem filtro de idade. É o que precisa de decisão hoje.

**2. Vencida.** `due_date` menor que hoje e status aberto. Usar `due_date_to` com a data de ontem em `YYYY-MM-DD`.

**3. Parada.** Status `em progresso` ou `revisão` sem atualização há **3 dias úteis ou mais**. Ver Como medir "parada", porque tem pegadinha.

**4. Sem dono.** Task aberta com `assignees` vazio nas listas do escopo. Sem dono não anda.

**5. Sem prazo.** `due_date` nulo em task que está `em progresso`. Task em backlog sem prazo é normal, não entra.

**6. Vence hoje ou amanhã.** Aviso, não cobrança. Fecha o digest.

## Como medir "parada"

Pegadinha verificada: **`clickup_filter_tasks` não devolve `date_updated`.** O payload dele traz id, name, status, url, priority, assignees, tags, due_date, date_closed e list, e nada mais.

Então:

1. Chamar `clickup_filter_tasks` com `order_by: "updated"` e `reverse: true`, que ordena da mais velha para a mais nova.
2. Pegar as candidatas do topo e confirmar a data com `clickup_get_task`, que aí sim traz `date_updated`.
3. Só chamar `get_task` nas candidatas, não no board inteiro. Uma chamada por task custa.

`due_date` e `date_updated` vêm em **epoch em milissegundos como string**, tipo `"1784185200000"`. Converter antes de comparar, e conferir contra a saída de `date`, não contra data hardcoded.

## Recorrentes

O board tem, de propósito, a mesma task recorrente em várias listas ao mesmo tempo: `[Monetização - Diária]` existe em BR01, BR02, MX e FIN, e o mesmo vale para `Precificação diária` e `[Monetização - Semanal]`.

Isso **não é duplicata para apagar**, é o ritual por squad. Tratamento:

- Agrupar todas as ocorrências do mesmo nome em **uma linha só**, dizendo em quantos squads está e quantos ainda estão abertos.
- Só destacar quando a ocorrência de um squad estiver com status diferente das outras, porque aí é sinal de que um squad ficou atrás.
- Nunca sugerir merge nem exclusão.

## Formato da saída

```
Follow-up · DD/MM · <n> itens que pedem ação

🔴 Prioridade alta (urgente e importante)
- <Nome da task> · <Squad> · <status> · <dono> · <há N dias sem update>
  <uma frase do que trava, se der para inferir do nome ou da descrição>
  https://app.clickup.com/t/<id>

🟡 Prioridade média (importante, não urgente)
- ...

🔵 Normal
- ...

Rituais recorrentes: [Monetização - Diária] aberta em 4 de 4 squads · Precificação diária aberta em 3 de 4
Sem dono: <n> · Sem prazo em progresso: <n>
```

Se uma seção estiver vazia, escrever "nada" na linha dela em vez de omitir. Seção que desaparece parece erro de coleta.

## Estilo

- **Uma linha por task**, com o link sempre. Sem parágrafo de contexto.
- **Nunca inventar o motivo do impedimento.** Se não está escrito na task, escrever "sem motivo registrado" e sugerir perguntar ao dono.
- Data em `DD/MM` no texto. Sem travessão. Sem tom de IA.
- Se o board estiver limpo, dizer isso em uma linha e parar. Digest inventado queima o ritual.

## Fora do escopo

- Montar report de monetização, que é a `report-monetizacao-site`
- Analisar dado de RPMS, MR ou eCPM
- Criar task a partir de reunião, que é a `reuniao-para-clickup`
- Mudar status, comentar ou fechar task sem OK explícito
- Postar no Slack por conta própria. Se o operador pedir, usar `slack_send_message_draft` e deixar o envio para ele

## Checklist antes de entregar

1. Rodei `date`.
2. Resolvi assignee por email.
3. Resolvi lista por `list_id`.
4. Paginei enquanto `has_more` era true.
5. Confirmei `date_updated` com `get_task` nas candidatas a parada, porque o filter não traz esse campo.
6. Usei o nome de status certo do espaço de cada lista, e não contei fechada como pendência.
7. Agrupei as recorrentes em uma linha, sem sugerir apagar.
8. Toda linha tem link.
9. Não escrevi nada no ClickUp.
