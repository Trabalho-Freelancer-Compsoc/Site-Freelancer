// scacesso.js: comportamento da página acesso.html (escolha entre contratar e prestar)
(function () {
    document.querySelectorAll("[data-modo]").forEach((botao) => {
        botao.addEventListener("click", async () => {
            const modo = botao.dataset.modo; //"contratar" ou "prestar"
            Auth.salvarModo(modo); //guarda a escolha no navegador

            //Se já está logado, a mesma conta serve: vai direto para a área escolhida
            const sessao = await Auth.obterSessao();
            window.location.href = sessao
                ? Auth.destinoDoModo(modo)
                : "login.html?modo=" + modo;
        });
    });
})();
