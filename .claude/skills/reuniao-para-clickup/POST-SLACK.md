[SKILL] Reunião para ClickUp

**O que é**
Uma skill do Claude Code que pega o que foi decidido numa reunião do Granola, ou numa thread do Slack, e transforma em task no ClickUp. Modo copilot: ela monta a proposta, mostra, e espera OK. Não cria nada sozinha.

Ela não é sobre criar task, criar task é fácil. Ela é sobre não criar task duplicada e acertar lista, dono e Setor. Board sujo é pior que board vazio.

**Como instalar**
Arquivo único, SKILL.md, sem dependência. Escolha onde colocar:
• Só para você: ~/.claude/skills/reuniao-para-clickup/SKILL.md
• Só no projeto: .claude/skills/reuniao-para-clickup/SKILL.md
• Para o time: interface de habilidades da organização

Requisito: MCP do ClickUp conectado, e do Granola se você quiser puxar de reunião. Slack só se quiser o rascunho do follow-up.

**Como usar**
Só pedir. Ela carrega sozinha com "vira as tarefas da daily", "joga os próximos passos no ClickUp", "abre as tasks da reunião de ontem", "transforma essa thread em task". Se quiser forçar, /reuniao-para-clickup.

Sem indicação, ela usa a Daily - AdsUp mais recente. Se você citar outra reunião, ela busca por nome.

**O que ela entrega**
Uma tabela de proposta, item por item: o que a ata decidiu, em que lista vai, quem é o dono, qual Setor, qual prazo, e se é task nova ou comentário numa task que já existe. Aí ela para e espera.

Depois do OK, cria só o que foi aprovado e devolve a mesma tabela com os links.

Item sem dono ou sem ação clara ela deixa de fora, e escreve o motivo. Isso é de propósito: "alguém vê isso" não é task.

**Os gotchas que ela resolve**
Estes são os que fazem a chamada falhar ou o board sujar:
• Assignee é ID numérico, e tem que resolver por email, não por nome. No ClickUp o Vinicius está como "Vinicius Oliveria", o Marcillio como "Marcillio - AdOps Pleno InCred", a Débora com o cargo colado no nome. Buscar por nome falha ou traz o registro errado
• Nome de status muda por espaço. Operação Adsup usa backlog, a fazer, em progresso, revisão, impedimento, complete. Minha lista pessoal usa to do, in progress, complete. Passar o status errado derruba a criação. Ela omite o status e deixa a lista aplicar o padrão
• A lista "Squad FIN " tem espaço no fim do nome. Resolver por nome dá erro, ela resolve por list_id
• Setor é campo de labels, o valor é o UUID da opção em JSON array, não o texto "Monetização"
• Tag que não existe no espaço falha calada, então ela não inventa tag
• Os campos BASELINE_ são da feature de baselines do ClickUp, ela não toca
• Deduplicação com filtro de lista. O board tem "[Monetização - Diária]" em BR01, BR02, MX e FIN ao mesmo tempo, então busca por palavra-chave solta dá falso positivo garantido. Ela busca dentro da lista alvo e pagina até o fim

**O que ela nunca faz**
• Não cria, comenta nem muda status sem OK explícito
• Não inventa dono nem prazo. Se a ata não diz, ela pergunta ou marca que falta
• Não manda mensagem no Slack. Ela monta rascunho, você revisa e envia
• Não mexe em status ou task de outra pessoa
• Não monta report de monetização nem analisa queda de RPMS. Isso é outra skill

**Por que essa e não uma rotina**
Segue o que combinamos na última: a inteligência fica na skill, a rotina é só gatilho. Aqui a lógica toda (roteamento de lista, dedupe, IDs, statuses por espaço) está no MD. Se depois alguém quiser agendar isso para rodar sozinho depois da daily, é só apontar a rotina para essa skill, sem reescrever nada.

**Um limite que vale saber**
Os IDs de lista, os UUID de Setor e os nomes de status estão dentro da skill. Quando criarem squad novo, ou renomearem status, alguém precisa atualizar, senão ela roteia para lista antiga sem avisar. Vale rodar uma conferida quando o board mudar.
