// scchat.js: comportamento da página chat.html
// A conversa é sempre entre duas pessoas: quem publicou um post e quem clicou em
// "Conversar" nesse post. Tudo passa pelo backend, que confere o login.
(async function () {
    const API = "http://localhost:3000"; //endereço do servidor (backend)
    const INTERVALO_MENSAGENS = 3000; //de quanto em quanto tempo busca mensagens novas (ms)
    const INTERVALO_CONVERSAS = 15000; //de quanto em quanto tempo atualiza a lista da esquerda (ms)

    const listaConversas = document.getElementById("conversas");
    const listaVazia = document.getElementById("lista-vazia");
    const semConversa = document.getElementById("sem-conversa");
    const areaConversa = document.getElementById("area-conversa");
    const nomeOutro = document.getElementById("nome-outro");
    const tituloPost = document.getElementById("titulo-post");
    const listaMensagens = document.getElementById("mensagens");
    const form = document.getElementById("form-mensagem");
    const campoTexto = document.getElementById("texto");
    const botaoEnviar = document.getElementById("botao-enviar");
    const erroChat = document.getElementById("erro-chat");

    document.getElementById("areaposts").addEventListener("click", () => {
        window.location.href = "index.html";
    });
    document.getElementById("perfil").addEventListener("click", () => {
        window.location.href = "perfil.html";
    });

    //Quem está logado. Sem login, o auth.js já manda para a tela de acesso
    const eu = await Auth.usuarioAtual();
    if (!eu) return;

    let conversas = []; //lista que veio do servidor
    let conversaAtual = null; //id da conversa aberta
    let ultimaMensagemId; //última mensagem desenhada (para não redesenhar à toa)
    let pedidos = 0; //conta as buscas de mensagens, para ignorar resposta atrasada
    let ultimoPedidoDesenhado = 0;

    //Chama o backend com o token de quem está logado e devolve o JSON da resposta
    async function chamarApi(caminho, opcoes = {}) {
        const token = await Auth.obterToken();
        if (!token) {
            window.location.replace("acesso.html");
            throw new Error("Faça login para continuar");
        }

        let resposta;
        try {
            resposta = await fetch(API + caminho, {
                ...opcoes,
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            });
        } catch {
            throw new Error("Não foi possível falar com o servidor. Veja se ele está ligado.");
        }

        const corpo = await resposta.json().catch(() => ({}));
        if (resposta.status === 401) window.location.replace("acesso.html"); //sessão expirou
        if (!resposta.ok) throw new Error(corpo.erro || "Erro no servidor");
        return corpo;
    }

    function mostrarErro(erro) {
        erroChat.textContent = erro.message || String(erro);
        erroChat.hidden = false;
    }

    function limparErro() {
        erroChat.hidden = true;
    }

    function formatarData(iso) {
        return new Date(iso).toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
        });
    }

    // ---------- Lista de conversas (coluna da esquerda) ----------
    function desenharConversas() {
        listaConversas.replaceChildren();
        listaVazia.hidden = conversas.length > 0;

        for (const conversa of conversas) {
            const botao = document.createElement("button");
            botao.type = "button";
            if (conversa.id === conversaAtual) botao.className = "ativa";

            //textContent: o que veio do banco aparece só como texto, nunca vira código na página
            const nome = document.createElement("strong");
            nome.textContent = conversa.outro.nome;

            const post = document.createElement("small");
            post.className = "post-da-conversa";
            post.textContent = conversa.projeto ? "Post: " + conversa.projeto.titulo : "Post removido";

            const previa = document.createElement("small");
            previa.className = "previa";
            previa.textContent = conversa.ultima_mensagem
                ? conversa.ultima_mensagem.conteudo
                : "Nenhuma mensagem ainda";

            botao.append(nome, post, previa);
            botao.addEventListener("click", () => abrirConversa(conversa.id));

            const item = document.createElement("li");
            item.appendChild(botao);
            listaConversas.appendChild(item);
        }
    }

    async function carregarConversas() {
        try {
            conversas = await chamarApi("/conversas");
            desenharConversas();
            limparErro();
        } catch (erro) {
            mostrarErro(erro);
        }
    }

    // ---------- Conversa aberta (coluna da direita) ----------
    function desenharMensagens(mensagens) {
        listaMensagens.replaceChildren();

        if (mensagens.length === 0) {
            const aviso = document.createElement("li");
            aviso.className = "aviso";
            aviso.textContent = "Nenhuma mensagem ainda. Mande a primeira!";
            listaMensagens.appendChild(aviso);
            return;
        }

        for (const mensagem of mensagens) {
            const balao = document.createElement("li");
            balao.className = mensagem.remetente_id === eu.id ? "balao minha" : "balao";

            const texto = document.createElement("div");
            texto.textContent = mensagem.conteudo;

            const hora = document.createElement("small");
            hora.textContent = formatarData(mensagem.criado_em);

            balao.append(texto, hora);
            listaMensagens.appendChild(balao);
        }
        listaMensagens.scrollTop = listaMensagens.scrollHeight; //rola até a mensagem mais nova
    }

    async function carregarMensagens() {
        if (!conversaAtual) return;
        const id = conversaAtual;
        const numero = ++pedidos;

        const mensagens = await chamarApi("/conversas/" + encodeURIComponent(id) + "/mensagens");

        //Ignora se a pessoa trocou de conversa ou se uma busca mais nova já foi desenhada
        if (id !== conversaAtual || numero < ultimoPedidoDesenhado) return;
        ultimoPedidoDesenhado = numero;

        const ultima = mensagens.length ? mensagens[mensagens.length - 1].id : null;
        if (ultima === ultimaMensagemId) return; //nada novo
        ultimaMensagemId = ultima;
        desenharMensagens(mensagens);
    }

    async function abrirConversa(id) {
        const conversa = conversas.find((c) => c.id === id);
        if (!conversa) {
            semConversa.textContent = "Conversa não encontrada.";
            return;
        }

        conversaAtual = id;
        ultimaMensagemId = undefined; //força desenhar na primeira busca
        history.replaceState(null, "", "chat.html?conversa=" + encodeURIComponent(id));

        nomeOutro.textContent = conversa.outro.nome;
        tituloPost.textContent = conversa.projeto ? "Sobre o post: " + conversa.projeto.titulo : "";
        listaMensagens.replaceChildren();
        semConversa.hidden = true;
        areaConversa.hidden = false;
        desenharConversas(); //marca a conversa aberta na lista

        try {
            await carregarMensagens();
            limparErro();
        } catch (erro) {
            mostrarErro(erro);
        }
        campoTexto.focus();
    }

    // ---------- Enviar ----------
    form.addEventListener("submit", async (e) => {
        e.preventDefault(); //evita recarregar a página
        const conteudo = campoTexto.value.trim();
        if (!conteudo || !conversaAtual) return;

        botaoEnviar.disabled = true;
        try {
            await chamarApi("/conversas/" + encodeURIComponent(conversaAtual) + "/mensagens", {
                method: "POST",
                body: JSON.stringify({ conteudo }),
            });
            campoTexto.value = "";
            await carregarMensagens();
            carregarConversas(); //atualiza a prévia e a ordem da lista
            limparErro();
        } catch (erro) {
            mostrarErro(erro);
        } finally {
            botaoEnviar.disabled = false;
            campoTexto.focus();
        }
    });

    //Enter envia; Shift+Enter pula linha
    campoTexto.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            form.requestSubmit();
        }
    });

    // ---------- Começo ----------
    await carregarConversas();

    //Veio do botão "Conversar" de um post: abre direto a conversa daquele post
    const pedida = new URLSearchParams(window.location.search).get("conversa");
    if (pedida) await abrirConversa(pedida);

    //Busca mensagens novas de tempos em tempos (só com a aba visível)
    setInterval(() => {
        if (!document.hidden) carregarMensagens().then(limparErro, mostrarErro);
    }, INTERVALO_MENSAGENS);

    setInterval(() => {
        if (!document.hidden) carregarConversas();
    }, INTERVALO_CONVERSAS);
})();
