// sccontratacoes.js: comportamento da página contratacoes.html
// (acompanhar pedidos, aceitar/recusar, finalizar o serviço e avaliar com estrelas)
(function () {
    const API_SERVIDOR = "http://localhost:3000"; //endereço do servidor (backend), o mesmo do main.js

    const listaFeitos = document.getElementById("lista-feitos");
    const listaRecebidos = document.getElementById("lista-recebidos");
    const mensagem = document.getElementById("mensagem");

    const SITUACAO_PEDIDO = {
        pendente: "Aguardando resposta",
        aceita: "Aceito",
        rejeitada: "Recusado",
        retirada: "Cancelado"
    };
    const SITUACAO_CONTRATO = {
        ativo: "Em andamento",
        concluido: "Concluído",
        cancelado: "Cancelado",
        em_disputa: "Em disputa"
    };

    //Cria um elemento já com a classe e o texto (textContent: nada do banco vira código)
    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function dinheiro(valor) {
        return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function estrelas(nota) {
        return "★".repeat(nota) + "☆".repeat(5 - nota);
    }

    //Fala com o servidor mandando o token de quem está logado
    async function chamar(metodo, caminho, corpo) {
        const token = await Auth.obterToken();
        if (!token) {
            window.location.href = "acesso.html";
            throw new Error("Entre na sua conta para continuar.");
        }
        const resposta = await fetch(API_SERVIDOR + caminho, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: corpo ? JSON.stringify(corpo) : undefined
        });
        let json = null;
        try { json = await resposta.json(); } catch { /* resposta sem corpo */ }
        if (!resposta.ok) {
            if (resposta.status === 401) window.location.href = "acesso.html";
            throw new Error((json && json.erro) || "Algo deu errado. Tente de novo.");
        }
        return json;
    }

    //Botão que desliga enquanto a ação roda e mostra o erro se falhar
    function botao(texto, classe, aoClicar) {
        const b = el("button", "botao " + classe, texto);
        b.type = "button";
        b.addEventListener("click", async () => {
            b.disabled = true;
            try {
                await aoClicar();
            } catch (erro) {
                if (erro.message !== "Cancelado.") Auth.mostrarMensagem(mensagem, erro.message, "erro"); //"Cancelado." = o usuário desistiu no confirm
                b.disabled = false;
            }
        });
        return b;
    }

    //Avaliação: 5 estrelas + comentário opcional
    function formularioAvaliacao(item) {
        const caixa = el("div", "avaliacao");
        caixa.append(el("p", "", `Como foi o serviço? Avalie ${item.outra_pessoa}:`));

        let nota = 0;
        const linha = el("div", "estrelas");
        const botoesEstrela = [];
        function pintar() {
            botoesEstrela.forEach((b, i) => b.classList.toggle("ativa", i < nota));
        }
        for (let i = 1; i <= 5; i++) {
            const b = el("button", "estrela", "★");
            b.type = "button";
            b.setAttribute("aria-label", `${i} de 5 estrelas`);
            b.addEventListener("click", () => { nota = i; pintar(); });
            botoesEstrela.push(b);
            linha.append(b);
        }

        const comentario = el("textarea");
        comentario.placeholder = "Comentário (opcional)";
        comentario.maxLength = 500;

        const enviar = botao("Enviar avaliação", "", async () => {
            if (!nota) throw new Error("Escolha de 1 a 5 estrelas.");
            await chamar("POST", `/contratacoes/contratos/${item.contrato.id}/avaliar`, {
                nota,
                comentario: comentario.value.trim()
            });
            await carregar("Avaliação enviada. Obrigado!");
        });

        caixa.append(linha, comentario, enviar);
        return caixa;
    }

    function avaliacaoFeita(titulo, avaliacao) {
        const caixa = el("div", "avaliacao");
        caixa.append(el("p", "", titulo), el("p", "estrelas-fixas", estrelas(avaliacao.nota)));
        if (avaliacao.comentario) caixa.append(el("p", "", avaliacao.comentario));
        return caixa;
    }

    //Monta o cartão de uma contratação
    function cartao(item) {
        const c = el("li", "cartao-contratacao");

        const situacaoChave = item.contrato ? item.contrato.status : item.status;
        const situacaoTexto = item.contrato ? SITUACAO_CONTRATO[item.contrato.status] : SITUACAO_PEDIDO[item.status];
        const topo = el("div", "cartao-topo");
        topo.append(el("strong", "", item.projeto.titulo), el("span", "selo " + situacaoChave, situacaoTexto || situacaoChave));

        const souPublicador = item.eu_sou === "publicador";
        const detalhes = el("div", "detalhes");
        detalhes.append(
            el("span", "", (souPublicador ? "Pedido de: " : "Publicado por: ") + item.outra_pessoa),
            el("span", "", dinheiro(item.valor)),
            el("span", "", `${item.prazo_dias} dia(s)`),
            el("span", "", item.projeto.localizacao || "Sem local especificado")
        );

        c.append(topo, detalhes);
        if (item.mensagem) c.append(el("p", "", item.mensagem));

        const acoes = el("div", "cartao-acoes");

        if (item.status === "pendente") {
            if (souPublicador) {
                acoes.append(
                    botao("Aceitar", "", async () => {
                        if (!confirm("Aceitar este pedido? Os outros pedidos desse serviço serão recusados.")) throw new Error("Cancelado.");
                        await chamar("POST", `/contratacoes/propostas/${item.proposta_id}/aceitar`);
                        await carregar("Pedido aceito! O serviço está em andamento.");
                    }),
                    botao("Recusar", "secundario", async () => {
                        await chamar("POST", `/contratacoes/propostas/${item.proposta_id}/recusar`);
                        await carregar("Pedido recusado.");
                    })
                );
            } else {
                acoes.append(
                    botao("Cancelar pedido", "secundario", async () => {
                        await chamar("POST", `/contratacoes/propostas/${item.proposta_id}/cancelar`);
                        await carregar("Pedido cancelado.");
                    })
                );
            }
        }

        if (item.contrato && item.contrato.status === "ativo") {
            if (souPublicador) {
                acoes.append(
                    botao("Finalizar serviço", "", async () => {
                        if (!confirm("O serviço foi concluído? Depois disso os dois poderão avaliar.")) throw new Error("Cancelado.");
                        await chamar("POST", `/contratacoes/contratos/${item.contrato.id}/finalizar`);
                        await carregar("Serviço finalizado! Agora avalie como foi.");
                    })
                );
            } else {
                c.append(el("p", "dica", "Quem publicou o serviço marca como finalizado quando terminar."));
            }
        }

        if (acoes.children.length > 0) c.append(acoes);

        if (item.contrato && item.contrato.status === "concluido") {
            if (item.minha_avaliacao) c.append(avaliacaoFeita("Sua avaliação:", item.minha_avaliacao));
            else c.append(formularioAvaliacao(item));
            if (item.avaliacao_recebida) c.append(avaliacaoFeita("Avaliação que você recebeu:", item.avaliacao_recebida));
        }

        return c;
    }

    function desenhar(itens) {
        const feitos = itens.filter((i) => i.eu_sou === "solicitante");
        const recebidos = itens.filter((i) => i.eu_sou === "publicador");

        [[listaFeitos, feitos, "Você ainda não pediu nenhum serviço."],
         [listaRecebidos, recebidos, "Ninguém pediu seus serviços ainda."]].forEach(([lista, dados, vazio]) => {
            lista.replaceChildren();
            if (dados.length === 0) lista.append(el("li", "vazio", vazio));
            else dados.forEach((i) => lista.append(cartao(i)));
        });
    }

    async function carregar(sucesso) {
        Auth.limparMensagem(mensagem);
        try {
            desenhar(await chamar("GET", "/contratacoes"));
            if (sucesso) Auth.mostrarMensagem(mensagem, sucesso, "sucesso");
        } catch (erro) {
            const texto = erro instanceof TypeError
                ? "Não foi possível falar com o servidor. Veja se ele está ligado."
                : erro.message;
            Auth.mostrarMensagem(mensagem, texto, "erro");
        }
    }

    Auth.obterSessao().then((sessao) => {
        if (sessao) carregar(); //sem login, o auth.js já manda para acesso.html
    });
})();
