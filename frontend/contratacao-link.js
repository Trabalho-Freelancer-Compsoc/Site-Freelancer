// contratacao-link.js: liga o feed e a busca (index.html) à tela de contratação, SEM mexer no main.js.
// 1) o botão "Contratar Serviço" de cada post (feed e resultados da busca) abre contratar.html?projeto=<id>
//    (escondido no modo prestar)
// 2) acrescenta o botão "Contratações" no menu lateral
(function () {
    const API_SERVIDOR = "http://localhost:3000"; //endereço do servidor (backend), o mesmo do main.js

    let projetos = []; //lista de serviços já buscada no servidor
    let espera = null;

    //No modo "prestar serviços" não se contrata: esconde o botão "Contratar Serviço" dos posts.
    //É só visual (a modalidade fica no navegador, não no banco). O auth.js é quem sabe o modo.
    const modoPrestar = window.Auth && Auth.obterModo() === "prestar";
    if (modoPrestar) {
        const estilo = document.createElement("style");
        estilo.textContent = ".contratar { display: none !important; }";
        document.head.appendChild(estilo);
    }

    async function buscarProjetos() {
        try {
            const resposta = await fetch(`${API_SERVIDOR}/projetos`);
            if (!resposta.ok) return;
            projetos = await resposta.json();
        } catch {
            /* servidor desligado: segue com a lista que já tinha */
        }
    }

    //O main.js desenha os posts sem guardar o id. Aqui descobrimos o id de cada botão comparando
    //título e descrição do post com a lista do servidor. O feed e os resultados da busca mostram
    //os mesmos serviços, então cada área é conferida separadamente.
    //Devolve quantos botões ficaram sem id.
    function anotarIds() {
        const usadosPorArea = new Map();
        let semId = 0;

        document.querySelectorAll(".contratar").forEach((botao) => {
            const post = botao.closest("li");
            if (!post) return;
            const area = post.closest("#resultados") ? "resultados" : "feed";
            if (!usadosPorArea.has(area)) usadosPorArea.set(area, new Set());
            const usados = usadosPorArea.get(area);

            const titulo = post.querySelector(".servico")?.textContent;
            const descricao = post.querySelector(".textodesc")?.textContent;
            const achado = projetos.find((p) => !usados.has(p.id) && p.titulo === titulo && p.descricao === descricao);
            if (achado) {
                usados.add(achado.id);
                botao.dataset.projeto = achado.id;
            } else {
                semId++;
            }
        });
        return semId;
    }

    async function atualizar() {
        if (anotarIds() > 0) {
            await buscarProjetos(); //tem post que ainda não conhecemos (post novo): busca a lista de novo
            anotarIds();
        }
    }

    //Sempre que a página redesenha posts ou resultados da busca, anota os ids de novo
    new MutationObserver(() => {
        clearTimeout(espera);
        espera = setTimeout(atualizar, 150);
    }).observe(document.body, { childList: true, subtree: true });
    buscarProjetos().then(atualizar);

    //Um único ouvinte na página inteira (o feed e a busca mudam a toda hora)
    document.addEventListener("click", (e) => {
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
        botaoMenu.style.cssText = "font-size:0.62rem;padding:2px 0;"; //cabe na barra estreita
        botaoMenu.addEventListener("click", () => {
            window.location.href = "contratacoes.html";
        });
        menu.insertBefore(botaoMenu, document.getElementById("bloco-acesso")); //null = vai para o fim
    }
})();