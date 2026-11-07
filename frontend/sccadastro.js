// sccadastro.js: comportamento da página cadastro.html
(async function () {
    const modo = Auth.obterModo(); //vem de ?modo=... ou do que foi guardado na tela de escolha

    //Já está logado: não precisa criar conta
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

    const form = document.getElementById("form-cadastro");
    const campoNome = document.getElementById("nome");
    const campoEmail = document.getElementById("email");
    const campoSenha = document.getElementById("senha");
    const campoConfirmar = document.getElementById("confirmar");
    const botaoCadastrar = document.getElementById("botao-cadastrar");
    const caixaMensagem = document.getElementById("mensagem");

    document.getElementById("rotulo-modo").textContent = Auth.ROTULOS[modo];
    document.getElementById("link-login").href = "login.html?modo=" + modo;
    document.getElementById("link-login-confirmacao").href = "login.html?modo=" + modo;

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); //evita recarregar a página
        Auth.limparMensagem(caixaMensagem);

        const nome = campoNome.value.trim().replace(/\s+/g, " ");
        const email = campoEmail.value.trim();
        const senha = campoSenha.value;
        const confirmar = campoConfirmar.value;

        //Confere os campos antes de falar com o Supabase
        let problema = "";
        if (nome.length < 2) problema = "Digite seu nome completo.";
        else if (nome.length > 100) problema = "O nome pode ter no máximo 100 caracteres.";
        else if (!Auth.emailValido(email)) problema = "Digite um e-mail válido.";
        else if (senha.length < 8) problema = "A senha precisa ter pelo menos 8 caracteres.";
        else if (senha !== confirmar) problema = "As senhas não são iguais.";

        if (problema) {
            Auth.mostrarMensagem(caixaMensagem, problema, "erro");
            return;
        }

        botaoCadastrar.disabled = true;
        botaoCadastrar.textContent = "Criando conta...";
        const { erro, situacao } = await Auth.cadastrar({ nome, email, senha });

        if (erro) {
            Auth.mostrarMensagem(caixaMensagem, erro, "erro");
            botaoCadastrar.disabled = false;
            botaoCadastrar.textContent = "Criar conta";
            return;
        }

        //Confirmação de e-mail desligada no Supabase: a conta já nasce logada
        if (situacao === "logado") {
            window.location.href = Auth.destinoDoModo(modo);
            return;
        }

        //Confirmação de e-mail ligada: avisa que precisa confirmar antes de entrar
        document.getElementById("email-confirmacao").textContent = email;
        form.hidden = true;
        document.getElementById("rodape-cadastro").hidden = true;
        document.getElementById("area-confirmacao").hidden = false;
    });
})();
