// sccontratar.js: comportamento da página contratar.html (formulário do "Contratar Serviço")
(function () {
    const API_SERVIDOR = "http://localhost:3000"; //endereço do servidor (backend), o mesmo do main.js

    const resumo = document.getElementById("resumo");
    const form = document.getElementById("form-contratar");
    const mensagem = document.getElementById("mensagem");
    const botao = document.getElementById("botao-enviar");

    function dinheiro(valor) {
        return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    //Mostra o serviço escolhido. textContent: o texto do banco nunca vira código na página
    function mostrarResumo(projeto) {
        const titulo = document.createElement("h2");
        titulo.textContent = projeto.titulo;

        const descricao = document.createElement("p");
        descricao.textContent = projeto.descricao;

        const detalhes = document.createElement("div");
        detalhes.className = "detalhes";
        const valor = document.createElement("span");
        valor.textContent = projeto.orcamento_min === null ? "Serviço Gratuito" : dinheiro(projeto.orcamento_min);
        const local = document.createElement("span");
        local.textContent = projeto.localizacao || "Sem local especificado";
        detalhes.append(valor, local);

        resumo.replaceChildren(titulo, descricao, detalhes);
        resumo.hidden = false;
    }

    async function iniciar() {
        const id = new URLSearchParams(window.location.search).get("projeto");
        if (!id) {
            Auth.mostrarMensagem(mensagem, 'Nenhum serviço escolhido. Volte ao site e clique em "Contratar Serviço".', "erro");
            return;
        }

        const usuario = await Auth.usuarioAtual();
        if (!usuario || !Auth.supabase) return; //sem login, o auth.js já manda para acesso.html

        //Leitura pública dos projetos (regra leitura_publica do banco)
        const { data: projeto, error } = await Auth.supabase
            .from("projetos")
            .select("id, titulo, descricao, orcamento_min, localizacao, cliente_id, status")
            .eq("id", id)
            .maybeSingle();

        if (error || !projeto) {
            Auth.mostrarMensagem(mensagem, "Não encontramos esse serviço. Ele pode ter sido removido.", "erro");
            return;
        }

        mostrarResumo(projeto);

        if (projeto.cliente_id === usuario.id) {
            Auth.mostrarMensagem(mensagem, "Você não pode contratar o próprio serviço.", "erro");
            return;
        }
        if (projeto.status !== "aberto") {
            Auth.mostrarMensagem(mensagem, "Este serviço não está mais aberto para contratação.", "erro");
            return;
        }

        if (projeto.orcamento_min !== null) document.getElementById("valor").value = projeto.orcamento_min;
        form.hidden = false;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            Auth.limparMensagem(mensagem);

            const valor = document.getElementById("valor").value.trim();
            const prazo = document.getElementById("prazo").value.trim();
            const texto = document.getElementById("texto").value.trim();

            if (valor === "" || Number(valor) < 0) {
                Auth.mostrarMensagem(mensagem, "Informe um valor válido (pode ser 0).", "erro");
                return;
            }
            if (!Number.isInteger(Number(prazo)) || Number(prazo) < 1 || Number(prazo) > 365) {
                Auth.mostrarMensagem(mensagem, "O prazo precisa ser de 1 a 365 dias.", "erro");
                return;
            }
            if (!texto) {
                Auth.mostrarMensagem(mensagem, "Conte o que você precisa nos detalhes.", "erro");
                return;
            }

            const token = await Auth.obterToken();
            if (!token) {
                window.location.href = "acesso.html";
                return;
            }

            botao.disabled = true;
            try {
                const resposta = await fetch(`${API_SERVIDOR}/contratacoes`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ projeto_id: projeto.id, valor, prazo_dias: prazo, mensagem: texto })
                });

                if (!resposta.ok) {
                    const falha = await resposta.json();
                    Auth.mostrarMensagem(mensagem, falha.erro, "erro");
                    if (resposta.status === 401) window.location.href = "acesso.html"; //sessão expirou
                    botao.disabled = false;
                    return;
                }
            } catch {
                Auth.mostrarMensagem(mensagem, "Não foi possível falar com o servidor. Veja se ele está ligado.", "erro");
                botao.disabled = false;
                return;
            }

            Auth.mostrarMensagem(mensagem, "Pedido enviado! Agora é só esperar a resposta de quem publicou o serviço.", "sucesso");
            form.hidden = true;
            setTimeout(() => { window.location.href = "contratacoes.html"; }, 1500);
        });
    }

    iniciar();
})();
