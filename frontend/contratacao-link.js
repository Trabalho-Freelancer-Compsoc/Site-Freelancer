// contratacao-link.js: liga o feed (index.html) à nova tela de contratação, SEM mexer no main.js.
// 1) o botão "Contratar Serviço" de cada post abre contratar.html?projeto=<id> (escondido no modo prestar)
// 2) acrescenta o botão "Contratações" no menu lateral
(function () {
    const API_SERVIDOR = "http://localhost:3000"; //endereço do servidor (backend), o mesmo do main.js
    const area = document.getElementById("postarea");
    if (!area) return;

    let espera = null;

    //No modo "prestar serviços" não se contrata: esconde o botão "Contratar Serviço" dos posts.
    //É só visual (a modalidade fica no navegador, não no banco). O auth.js é quem sabe o modo.
    const modoPrestar = window.Auth && Auth.obterModo() === "prestar";
    if (modoPrestar) {
        const estilo = document.createElement("style");
        estilo.textContent = ".contratar { display: none !important; }";
        document.head.appendChild(estilo);
    }

    //O main.js desenha os posts sem guardar o id. Aqui buscamos a mesma lista (mesma ordem)
    //e anotamos o id em cada botão, conferindo título e descrição para não errar de post.
    async function anotarIds() {
        let projetos;
        try {
            const resposta = await fetch(`${API_SERVIDOR}/projetos`);
            if (!resposta.ok) return;
            projetos = await resposta.json();
        } catch {
            return;
        }

        const usados = new Set();
        area.querySelectorAll("li.postados").forEach((post) => {
            const botao = post.querySelector(".contratar");
            if (!botao) return;
            const titulo = post.querySelector(".servico")?.textContent;
            const descricao = post.querySelector(".textodesc")?.textContent;
            const achado = projetos.find((p) => !usados.has(p.id) && p.titulo === titulo && p.descricao === descricao);
            if (achado) {
                usados.add(achado.id);
                botao.dataset.projeto = achado.id;
            }
        });
    }

    //Sempre que o main.js redesenha os posts, anota os ids de novo
    new MutationObserver(() => {
        clearTimeout(espera);
        espera = setTimeout(anotarIds, 150);
    }).observe(area, { childList: true });
    anotarIds();

    //Um único ouvinte na lista inteira (os posts mudam a toda hora)
    area.addEventListener("click", (e) => {
        const botao = e.target.closest(".contratar");
        if (!botao || modoPrestar) return;
        const id = botao.dataset.projeto;
        if (!id) {
            alert("Aguarde o serviço terminar de carregar e tente de novo.");
            return;
        }
        window.location.href = "contratar.html?projeto=" + encodeURIComponent(id);
    });

    //Botão no menu lateral, junto com Perfil e Bate Papo
    const menu = document.getElementById("layout");
    if (menu) {
        const botaoMenu = document.createElement("button");
        botaoMenu.type = "button"; //o menu fica dentro de um <form>: sem isso, enviaria o formulário
        botaoMenu.id = "contratacoes";
        botaoMenu.textContent = "Contratações";
        botaoMenu.addEventListener("click", () => {
            window.location.href = "contratacoes.html";
        });
        menu.insertBefore(botaoMenu, document.getElementById("bloco-acesso")); //null = vai para o fim
    }
})();