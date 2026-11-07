// scnovasenha.js: comportamento da página nova-senha.html
(async function () {
    const textoVerificando = document.getElementById("verificando");
    const areaForm = document.getElementById("area-form");
    const areaInvalido = document.getElementById("area-invalido");

    //O link do e-mail traz um acesso temporário; o supabase-js o transforma em sessão.
    //Sem sessão, o link é inválido ou já expirou.
    const sessao = await Auth.obterSessao();
    textoVerificando.hidden = true;

    if (!sessao) {
        areaInvalido.hidden = false;
        return;
    }
    areaForm.hidden = false;

    const form = document.getElementById("form-nova-senha");
    const campoSenha = document.getElementById("senha");
    const campoConfirmar = document.getElementById("confirmar");
    const botaoSalvar = document.getElementById("botao-salvar");
    const caixaMensagem = document.getElementById("mensagem");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        Auth.limparMensagem(caixaMensagem);

        const senha = campoSenha.value;
        if (senha.length < 8) {
            Auth.mostrarMensagem(caixaMensagem, "A senha precisa ter pelo menos 8 caracteres.", "erro");
            return;
        }
        if (senha !== campoConfirmar.value) {
            Auth.mostrarMensagem(caixaMensagem, "As senhas não são iguais.", "erro");
            return;
        }

        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";
        const { erro } = await Auth.trocarSenha(senha);

        if (erro) {
            Auth.mostrarMensagem(caixaMensagem, erro, "erro");
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = "Salvar nova senha";
            return;
        }

        Auth.mostrarMensagem(caixaMensagem, "Senha alterada com sucesso! Redirecionando...", "sucesso");
        setTimeout(() => {
            window.location.href = "acesso.html";
        }, 1800);
    });
})();
