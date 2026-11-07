// =====================================================================
// auth.js: autenticação do FreelanTchê (Supabase Auth, no navegador)
//
// Em cada página, carregue nesta ordem (todos com "defer"):
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2" defer></script>
//   <script src="auth.js" defer></script>
//
// Tudo fica dentro de uma função para não brigar com nomes de outros arquivos
// (o main.js, por exemplo, já usa "API" e "postarea").
// O único nome exposto para o resto do site é:  window.Auth
// =====================================================================
(function () {
  // ---------- 1. CONFIGURAÇÃO ----------
  // Mesmos valores do .env do backend. A chave PUBLISHABLE foi feita para ficar no navegador:
  // quem protege os dados são as regras do banco (RLS).
  // NUNCA coloque aqui a SUPABASE_SECRET_KEY.
  const SUPABASE_URL = 'https://pbioppahmxcdqvdwifgp.supabase.co'
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_r5vIi1Px48U6zEXbXrQkYQ_hlnWYCzO'

  // Para onde cada modalidade leva depois do login.
  // Hoje só existe o index.html (feed de posts). Quando os colegas criarem as páginas
  // de cada área, basta trocar aqui. Exemplo: prestar: 'freelancer.html'
  const DESTINOS = {
    contratar: 'index.html',
    prestar: 'index.html',
  }
  const ROTULOS = { contratar: 'Contratar serviços', prestar: 'Prestar serviços' }
  const CHAVE_MODO = 'freelantche_modo' // onde o navegador guarda a modalidade escolhida
  const PAGINA_ACESSO = 'acesso.html'

  const MSG_CONFIG =
    'O login não foi configurado ou o supabase-js não carregou. Confira o começo do auth.js e o console do navegador (F12).'
  const MSG_EMAIL_JA_CADASTRADO =
    'Este e-mail já está cadastrado. Entre com sua senha ou use "Esqueci minha senha".'

  // ---------- 2. CONEXÃO COM O SUPABASE ----------
  let clienteSupabase = null
  if (window.supabase && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
    clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      // A sessão fica no localStorage do navegador e é renovada sozinha
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }

  function aoCarregar(funcao) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', funcao)
    else funcao()
  }

  // ---------- 3. MODALIDADE (contratar / prestar) ----------
  // A modalidade NÃO vai para o Supabase: é só uma preferência de navegação.
  // Por isso a mesma conta (e-mail + senha) serve para as duas.
  function modoValido(modo) {
    return modo === 'contratar' || modo === 'prestar'
  }

  function obterModo() {
    const daUrl = new URLSearchParams(window.location.search).get('modo')
    if (modoValido(daUrl)) return daUrl
    try {
      const salvo = window.localStorage.getItem(CHAVE_MODO)
      if (modoValido(salvo)) return salvo
    } catch (e) {}
    return null
  }

  function salvarModo(modo) {
    if (!modoValido(modo)) return
    try {
      window.localStorage.setItem(CHAVE_MODO, modo)
    } catch (e) {}
  }

  function destinoDoModo(modo) {
    return DESTINOS[modoValido(modo) ? modo : 'contratar']
  }

  // ---------- 4. SESSÃO ----------
  async function obterSessao() {
    if (!clienteSupabase) return null
    const { data, error } = await clienteSupabase.auth.getSession()
    if (error) {
      console.error(error)
      return null
    }
    return data.session
  }

  // Token (JWT) para mandar ao backend: Authorization: Bearer <token>
  async function obterToken() {
    const sessao = await obterSessao()
    return sessao ? sessao.access_token : null
  }

  // Quem está logado. O "id" é o mesmo que o banco enxerga como auth.uid()
  async function usuarioAtual() {
    const sessao = await obterSessao()
    if (!sessao) return null
    const u = sessao.user
    return {
      id: u.id,
      email: u.email,
      nome: (u.user_metadata && u.user_metadata.nome_completo) || null,
    }
  }

  // ---------- 5. MENSAGENS DE ERRO EM PORTUGUÊS ----------
  function traduzirErro(erro) {
    erro = erro || {}
    const codigo = erro.code || ''
    const texto = String(erro.message || '').toLowerCase()

    if (codigo === 'invalid_credentials' || texto.includes('invalid login credentials')) {
      // O Supabase não diz se foi o e-mail ou a senha: é proposital, por segurança
      return 'E-mail ou senha incorretos.'
    }
    if (codigo === 'email_not_confirmed' || texto.includes('email not confirmed')) {
      return 'Seu e-mail ainda não foi confirmado. Abra o e-mail que enviamos no cadastro (veja também o spam) e clique no link.'
    }
    if (codigo === 'user_already_exists' || codigo === 'email_exists' || texto.includes('already registered')) {
      return MSG_EMAIL_JA_CADASTRADO
    }
    if (codigo === 'weak_password' || texto.includes('password should')) {
      return 'Senha fraca demais. Use pelo menos 8 caracteres, misturando letras e números.'
    }
    if (codigo === 'same_password') {
      return 'A nova senha precisa ser diferente da senha atual.'
    }
    if (codigo === 'email_address_invalid' || texto.includes('invalid email')) {
      return 'Esse e-mail não é aceito. Confira se digitou corretamente.'
    }
    if (codigo === 'signup_disabled') {
      return 'Novos cadastros estão desativados no momento.'
    }
    if (
      codigo === 'over_request_rate_limit' ||
      codigo === 'over_email_send_rate_limit' ||
      erro.status === 429 ||
      texto.includes('rate limit')
    ) {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.'
    }
    if (erro.name === 'AuthRetryableFetchError' || texto.includes('failed to fetch') || texto.includes('network')) {
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.'
    }
    console.error('Erro de autenticação não mapeado:', erro)
    return 'Não foi possível concluir a operação. Tente novamente em instantes.'
  }

  function urlDaPagina(nomeDoArquivo) {
    return new URL(nomeDoArquivo, window.location.href).href
  }

  // ---------- 6. AÇÕES (todas devolvem { erro: 'mensagem' | null, ... }) ----------
  async function entrar(email, senha) {
    if (!clienteSupabase) return { erro: MSG_CONFIG }
    try {
      const { error } = await clienteSupabase.auth.signInWithPassword({ email, password: senha })
      return { erro: error ? traduzirErro(error) : null }
    } catch (e) {
      return { erro: traduzirErro(e) }
    }
  }

  // Cria UMA conta, sem modalidade. O nome vai junto como metadado (nome_completo)
  // para o banco poder usar quando criar o perfil.
  async function cadastrar({ nome, email, senha }) {
    if (!clienteSupabase) return { erro: MSG_CONFIG }
    try {
      const { data, error } = await clienteSupabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome_completo: nome },
          emailRedirectTo: urlDaPagina('login.html'), // para onde o link do e-mail leva
        },
      })
      if (error) return { erro: traduzirErro(error) }

      // Com "Confirm email" ligado, e-mail já cadastrado NÃO dá erro: o Supabase devolve
      // um usuário de mentira, sem "identities". É assim que dá para detectar.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { erro: MSG_EMAIL_JA_CADASTRADO }
      }
      if (data.session) return { erro: null, situacao: 'logado' } // confirmação de e-mail desligada
      return { erro: null, situacao: 'confirmar_email' }
    } catch (e) {
      return { erro: traduzirErro(e) }
    }
  }

  async function sair() {
    if (clienteSupabase) {
      try {
        await clienteSupabase.auth.signOut({ scope: 'local' }) // encerra só neste navegador
      } catch (e) {
        console.error(e)
      }
    }
    window.location.href = PAGINA_ACESSO
  }

  async function recuperarSenha(email) {
    if (!clienteSupabase) return { erro: MSG_CONFIG }
    try {
      const { error } = await clienteSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: urlDaPagina('nova-senha.html'),
      })
      return { erro: error ? traduzirErro(error) : null }
    } catch (e) {
      return { erro: traduzirErro(e) }
    }
  }

  async function trocarSenha(novaSenha) {
    if (!clienteSupabase) return { erro: MSG_CONFIG }
    try {
      const { error } = await clienteSupabase.auth.updateUser({ password: novaSenha })
      return { erro: error ? traduzirErro(error) : null }
    } catch (e) {
      return { erro: traduzirErro(e) }
    }
  }

  // ---------- 7. AJUDAS DE TELA ----------
  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function mostrarMensagem(elemento, texto, tipo) {
    if (!elemento) return
    elemento.textContent = texto // textContent: nunca interpreta o texto como HTML
    elemento.className = 'mensagem ' + (tipo || 'erro')
    elemento.hidden = false
  }

  function limparMensagem(elemento) {
    if (!elemento) return
    elemento.textContent = ''
    elemento.hidden = true
  }

  // ---------- 8. COMPORTAMENTOS AUTOMÁTICOS ----------
  // a) Páginas com <body data-requer-login> mandam visitante para a tela de acesso.
  //    Isto é só conforto de navegação: a proteção de verdade é feita pelo backend e pelo RLS.
  function protegerPagina(sessao) {
    if (document.body && document.body.hasAttribute('data-requer-login') && !sessao) {
      window.location.replace(PAGINA_ACESSO)
    }
  }

  // b) Se a página tiver o menu lateral (#layout), acrescenta Entrar / Trocar modo / Sair.
  function montarBotoesNaBarra(sessao) {
    const barra = document.getElementById('layout')
    if (!barra) return

    let bloco = document.getElementById('bloco-acesso')
    if (!bloco) {
      bloco = document.createElement('div')
      bloco.id = 'bloco-acesso'
      bloco.style.cssText = 'display:flex;flex-direction:column;gap:10px;'
      barra.appendChild(bloco)
    }
    bloco.replaceChildren()

    function criarBotao(texto, aoClicar) {
      const botao = document.createElement('button')
      botao.type = 'button' // importante: no index.html o menu fica dentro de um <form>
      botao.textContent = texto
      botao.addEventListener('click', aoClicar)
      bloco.appendChild(botao)
    }

    if (!sessao) {
      criarBotao('Entrar', () => {
        window.location.href = PAGINA_ACESSO
      })
      return
    }

    const modo = obterModo()
    if (modo) {
      const etiqueta = document.createElement('small')
      etiqueta.textContent = 'Modo: ' + ROTULOS[modo]
      etiqueta.style.cssText = 'background:white;color:black;padding:2px 4px;border-radius:4px;font-size:0.7rem;'
      bloco.appendChild(etiqueta)
    }
    criarBotao('Trocar modo', () => {
      window.location.href = PAGINA_ACESSO
    })
    criarBotao('Sair', sair)
  }

  // c) Reage a login/logout (inclusive em outra aba). Sem chamadas ao Supabase aqui dentro.
  if (clienteSupabase) {
    clienteSupabase.auth.onAuthStateChange((evento, sessao) => {
      aoCarregar(() => {
        montarBotoesNaBarra(sessao)
        protegerPagina(sessao)
      })
    })
  } else {
    console.error(MSG_CONFIG)
    aoCarregar(() => {
      montarBotoesNaBarra(null)
      protegerPagina(null)
      const caixa = document.querySelector('.caixa-acesso')
      if (caixa) {
        const aviso = document.createElement('p')
        aviso.className = 'mensagem erro'
        aviso.textContent = MSG_CONFIG
        caixa.prepend(aviso)
      }
    })
  }

  // ---------- 9. O QUE FICA DISPONÍVEL PARA O RESTO DO SITE ----------
  window.Auth = {
    configurado: !!clienteSupabase,
    supabase: clienteSupabase, // para consultas ao banco como o usuário logado (RLS vale)
    ROTULOS,
    obterModo,
    salvarModo,
    destinoDoModo,
    obterSessao,
    obterToken,
    usuarioAtual,
    entrar,
    cadastrar,
    sair,
    recuperarSenha,
    trocarSenha,
    emailValido,
    mostrarMensagem,
    limparMensagem,
  }
})()
