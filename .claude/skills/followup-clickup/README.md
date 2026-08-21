# followup-clickup

Digest de follow-up do ClickUp para a daily. Lê o board, separa o que precisa de decisão hoje, entrega no chat pronto para colar.

## O que é

Uma skill do Claude Code que responde uma pergunta só: **o que está travado agora e de quem depende.**

Ela não é um relatório de board. Board tem 33 tasks abertas, e listar 33 linhas não ajuda ninguém. Ela busca seis coisas, nessa ordem de prioridade, e ignora o resto.

## Como instalar

Arquivo único, `SKILL.md`, sem dependência. Escolha onde colocar:

- Só para você: `~/.claude/skills/followup-clickup/SKILL.md`
- Só no projeto: `.claude/skills/followup-clickup/SKILL.md`
- Para o time: interface de habilidades da organização

Requisito: **MCP do ClickUp conectado**. Slack só se você quiser o rascunho para postar.

## Como usar

Só pedir. Ela carrega sozinha com:

- "monta o followup"
- "o que tá travado"
- "prepara a daily"
- "como tá meu board"
- "o que venceu"

Para forçar: `/followup-clickup`.

Sem indicação, o escopo é **as suas tasks abertas** nos squads do AdsUp mais Tarefas Estruturais - Monetização. Você pode restringir ou ampliar em linguagem natural: "só do BR02", "do Marcillio também", "do time todo".

## O que ela entrega

Digest agrupado por prioridade, uma linha por task, com link sempre:

```
Follow-up · 21/08 · 5 itens que pedem ação

🔴 Prioridade alta
- Novas regras de preços BR02 · Squad BR02 · em progresso · Ismael · 4 dias sem update
  https://app.clickup.com/t/86bbgcray

🟡 Prioridade média
- ...

🔵 Normal
- ...

Rituais recorrentes: [Monetização - Diária] aberta em 4 de 4 squads
Sem dono: 2 · Sem prazo em progresso: 1
```

Se o board estiver limpo, ela diz isso em uma linha e para. Digest inventado queima o ritual.

## As seis leituras, em ordem

1. **Impedimento** — status `impedimento`. Entra sempre, sem filtro de idade. É o que precisa de decisão hoje.
2. **Vencida** — prazo passou e status ainda aberto.
3. **Parada** — `em progresso` ou `revisão` há 3 dias úteis ou mais sem update.
4. **Sem dono** — task aberta sem assignee.
5. **Sem prazo** — só quando está `em progresso`. Backlog sem prazo é normal e não entra.
6. **Vence hoje ou amanhã** — aviso, não cobrança.

## Os gotchas que ela resolve

Estes foram levantados chamando as ferramentas contra o board real, não são suposição:

- **`clickup_filter_tasks` não devolve `date_updated`.** O payload traz status, prioridade, assignee, prazo e lista, e nada de data de atualização. Sem saber disso, "parada há N dias" sai inventado. Ela ordena por `updated` com `reverse`, pega as candidatas do topo e confirma com `get_task`, que aí sim traz o campo. Só nas candidatas, para não gastar uma chamada por task.
- **Nome de status muda por espaço.** Operação Adsup usa `backlog / a fazer / em progresso / revisão / impedimento / complete`. A lista pessoal usa `to do / in progress / complete`. Parte das listas do Operação Incred usa `concluído` em vez de `complete`. Errar isso faz task fechada contar como pendência.
- **`impedimento` só existe no Adsup.** É o status mais importante do digest e não dá para procurar nas outras listas.
- **A lista "Squad FIN " tem espaço no fim do nome.** Resolver por nome dá erro, ela resolve por `list_id`.
- **Assignee é ID numérico e tem que ser resolvido por email.** No ClickUp o Vinicius está como "Vinicius Oliveria", o Marcillio como "Marcillio - AdOps Pleno InCred", a Débora com o cargo colado no nome. Busca por nome falha ou traz o registro errado.
- **Datas vêm em epoch de milissegundos como string.** `"1784185200000"`. Comparar sem converter dá resultado silenciosamente errado.
- **Paginação em 100.** Enquanto vier `has_more`, tem mais board. Uma página só não é a resposta.
- **Recorrente em várias listas é desenho, não duplicata.** `[Monetização - Diária]` existe em BR01, BR02, MX e FIN de propósito. Ela agrupa numa linha e só destaca quando um squad ficou atrás dos outros. Nunca sugere apagar.

## O que ela nunca faz

- Não muda status, não comenta, não fecha task. Só leitura por padrão
- Não inventa o motivo do impedimento. Se não está escrito na task, ela escreve "sem motivo registrado" e sugere perguntar ao dono
- Não posta no Slack sozinha. Monta rascunho, você envia
- Não analisa dado de monetização, e não cria task de reunião. São outras skills

## Limites que valem saber

- **Os IDs de lista e os nomes de status estão dentro da skill.** Squad novo ou status renomeado exige atualizar o MD, senão ela deixa de ver aquela lista sem avisar. Vale conferir quando o board mudar.
- **"3 dias úteis" é um número escolhido, não medido.** Se para o seu ritmo o corte certo é 2 ou 5, é uma linha para trocar.
- **Ela não sabe o que é importante, sabe o que está travado.** Prioridade vem do campo do ClickUp. Se o campo não estiver preenchido, tudo cai em normal.

## Como virar rotina depois

A lógica toda está aqui no MD, e é de propósito: seguindo o que o time combinou, rotina é gatilho e contexto fica na skill. Para rodar sozinho antes da daily, agenda uma rotina que diz só "monta o followup e posta como rascunho no canal". Não precisa reescrever nada disso.
