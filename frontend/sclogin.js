// sclogin.js: comportamento da página login.html
(async function () {
    const modo = Auth.obterModo(); //vem de ?modo=... ou do que foi guardado na tela de escolha

    //Já está logado (ou acabou de confirmar o e-mail): não precisa entrar de novo
    const sessao = await Auth.obterSessao();
    if (sessao) {
        window.location.replace(modo ? Auth.destinoDoModo(modo) : "acesso.html");
        return;
    }

    //Chegou sem escolher a modalidade: volta para a escolha
    if (!modo) {
        window.location.replace("acesso.html");
        return;
    }
    Auth.salvarModo(modo);

    const form = document.getElementById("form-login");
    const campoEmail = document.getElementById("email");
    const campoSenha = document.getElementById("senha");
    const botaoEntrar = document.getElementById("botao-entrar");
    const botaoEsqueci = document.getElementById("botao-esqueci");
    const caixaMensagem = document.getElementById("mensagem");

    document.getElementById("rotulo-modo").textContent = Auth.ROTULOS[modo];
    document.getElementById("link-cadastro").href = "cadastro.html?modo=" + modo;

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); //evita recarregar a página
        Auth.limparMensagem(caixaMensagem);

        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        if (!email || !senha) {
            Auth.mostrarMensagem(caixaMensagem, "Preencha o e-mail e a senha.", "erro");
            return;
        }
        if (!Auth.emailValido(email)) {
            Auth.mostrarMensagem(caixaMensagem, "Digite um e-mail válido.", "erro");
            return;
        }

        botaoEntrar.disabled = true;
        botaoEntrar.textContent = "Entrando...";
        const { erro } = await Auth.entrar(email, senha);

        if (erro) {
            Auth.mostrarMensagem(caixaMensagem, erro, "erro");
            botaoEntrar.disabled = false;
            botaoEntrar.textContent = "Entrar";
            return;
        }

        //Login feito: vai para a área da modalidade escolhida
        window.location.href = Auth.destinoDoModo(modo);
    });

    botaoEsqueci.addEventListener("click", async () => {
        Auth.limparMensagem(caixaMensagem);
        const email = campoEmail.value.trim();

        if (!Auth.emailValido(email)) {
            Auth.mostrarMensagem(caixaMensagem, "Digite seu e-mail no campo acima para receber o link de recuperação.", "erro");
            campoEmail.focus();
            return;
        }

        botaoEsqueci.disabled = true;
        const { erro } = await Auth.recuperarSenha(email);
        botaoEsqueci.disabled = false;

        if (erro) {
            Auth.mostrarMensagem(caixaMensagem, erro, "erro");
            return;
        }
        //Mensagem igual exista o e-mail ou não, para não revelar quem tem conta
        Auth.mostrarMensagem(caixaMensagem, "Se esse e-mail estiver cadastrado, enviamos um link para criar uma nova senha. Confira também o spam.", "sucesso");
    });
})();
