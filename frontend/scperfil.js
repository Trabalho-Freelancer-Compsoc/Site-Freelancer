console.log("scperfil carregou")
const $ = (id) => document.getElementById(id)

// Endereço do backend (no perfil.html o main.js não é carregado, então definimos aqui)
const API = "http://localhost:3000"

$("areaposts").addEventListener("click", () => {
    window.location.href = "index.html"
})
$("chat").addEventListener("click", () => {
    window.location.href = "chat.html"
})

// Nunca use select("*") em perfis: o banco bloqueia (script 05)
const COLUNAS_PERFIL = "id, nome_completo, nome_usuario, bio, localizacao, url_avatar"
const COLUNAS_FREELA = "titulo, valor_hora, disponibilidade, nivel_experiencia, idiomas, avaliacao_media, trabalhos_concluidos, url_curriculo"

let usuario = null
let perfil = null
let freela = null


function mostrarAvatar(p) {
    const caixa = $("avatar")
    const inicial = p.nome_completo.trim().charAt(0).toUpperCase()
    caixa.replaceChildren()
    if (!p.url_avatar) {
        caixa.textContent = inicial
        return
    }
    const img = document.createElement("img")
    img.alt = "Foto de " + p.nome_completo
    img.addEventListener("error", () => { // se a imagem falhar, volta para a inicial
        caixa.replaceChildren()
        caixa.textContent = inicial
    })
    img.src = p.url_avatar
    caixa.appendChild(img)
}

// ----- Dados básicos -----
function mostrarPerfil(p) {
    perfil = p
    $("nome").textContent = p.nome_completo
    $("usuario").textContent = p.nome_usuario ? "@" + p.nome_usuario : ""
    $("local").textContent = p.localizacao || ""
    $("bio").textContent = p.bio || "Você ainda não escreveu nada sobre você."
    mostrarAvatar(p)
    $("cartao-basico").hidden = false
}

$("btn-editar").addEventListener("click", () => {
    $("f-nome").value = perfil.nome_completo
    $("f-usuario").value = perfil.nome_usuario || ""
    $("f-local").value = perfil.localizacao || ""
    $("f-bio").value = perfil.bio || ""
    $("f-foto").value = ""
    $("cartao-basico").hidden = true
    $("form-editar").hidden = false
})

$("btn-cancelar").addEventListener("click", () => {
    $("form-editar").hidden = true
    $("cartao-basico").hidden = false
})

$("form-editar").addEventListener("submit", async (e) => {
    e.preventDefault()
    const dados = {
        nome_completo: $("f-nome").value.trim(),
        nome_usuario: $("f-usuario").value.trim() || null,
        localizacao: $("f-local").value.trim() || null,
        bio: $("f-bio").value.trim() || null,
        atualizado_em: new Date().toISOString(), // nada atualiza isso sozinho
    }
    if (!dados.nome_completo) return Auth.mostrarMensagem($("msg"), "Informe seu nome.")

    const arquivo = $("f-foto").files[0]
    if (arquivo) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
            return Auth.mostrarMensagem($("msg"), "Use uma imagem JPG, PNG ou WEBP.")
        }
        if (arquivo.size > 2 * 1024 * 1024) {
            return Auth.mostrarMensagem($("msg"), "A imagem deve ter no máximo 2 MB.")
        }
        const caminho = perfil.id + "/avatar" // sempre o mesmo nome: a foto nova substitui a antiga
        const envio = await Auth.supabase.storage
            .from("avatares")
            .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type })
        if (envio.error) return Auth.mostrarMensagem($("msg"), "Não foi possível enviar a foto.")

        const { data: pub } = Auth.supabase.storage.from("avatares").getPublicUrl(caminho)
        dados.url_avatar = pub.publicUrl + "?v=" + Date.now() // evita o navegador mostrar a foto antiga
    }
    const { error } = await Auth.supabase.from("perfis").update(dados).eq("id", perfil.id)
    if (error) {
        return Auth.mostrarMensagem($("msg"),
            error.code === "23505" ? "Esse nome de usuário já existe." : "Não foi possível salvar.")
    }
    Auth.limparMensagem($("msg"))
    mostrarPerfil({ ...perfil, ...dados })
    $("form-editar").hidden = true
})

// ----- Perfil profissional -----
function mostrarFreela(f) {
    freela = f
    $("form-freela").hidden = true
    $("freela-vazio").hidden = !!f
    $("freela-dados").hidden = !f
    if (!f) return

    $("freela-titulo").textContent = f.titulo || "Sem título"
    $("freela-valor").textContent = f.valor_hora != null
        ? Number(f.valor_hora).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + " / hora"
        : "Valor por hora não informado"
    $("freela-disp").textContent = "Disponibilidade: " + (f.disponibilidade || "não informada")
    $("freela-nivel").textContent = "Nível: " + (f.nivel_experiencia || "não informado")
    $("freela-idiomas").textContent = "Idiomas: " + (Array.isArray(f.idiomas) && f.idiomas.length ? f.idiomas.join(", ") : "não informados")
    $("freela-nota").textContent = "Nota média: " + f.avaliacao_media + " · Trabalhos concluídos: " + f.trabalhos_concluidos

    // O link do currículo já existe no HTML: só mostramos ou escondemos
    const linkCurriculo = $("freela-curriculo-link")
    if (f.url_curriculo) {
        linkCurriculo.href = f.url_curriculo
        linkCurriculo.hidden = false
    } else {
        linkCurriculo.hidden = true
    }
}

function abrirFormFreela() {
    $("ff-titulo").value = freela?.titulo || ""
    $("ff-valor").value = freela?.valor_hora ?? ""
    $("ff-disp").value = freela?.disponibilidade || ""
    $("ff-nivel").value = freela?.nivel_experiencia || ""
    $("ff-idiomas").value = Array.isArray(freela?.idiomas) ? freela.idiomas.join(", ") : ""
    $("ff-curriculo").value = "" // limpa o input do currículo ao abrir
    $("freela-vazio").hidden = true
    $("freela-dados").hidden = true
    $("form-freela").hidden = false
}

$("btn-criar-freela").addEventListener("click", abrirFormFreela)
$("btn-editar-freela").addEventListener("click", abrirFormFreela)
$("btn-cancelar-freela").addEventListener("click", () => mostrarFreela(freela))

// Alguns navegadores não informam o tipo de .doc/.docx; por isso conferimos também a extensão
function curriculoPermitido(arquivo) {
    const tiposPermitidos = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    const extensaoOk = /\.(pdf|doc|docx)$/i.test(arquivo.name)
    return tiposPermitidos.includes(arquivo.type) || (arquivo.type === "" && extensaoOk)
}

$("form-freela").addEventListener("submit", async (e) => {
    e.preventDefault()
    const valorTexto = $("ff-valor").value.trim()
    const valor = valorTexto === "" ? null : Number(valorTexto)
    if (valor !== null && (!Number.isFinite(valor) || valor < 0)) {
        return Auth.mostrarMensagem($("msg"), "Valor por hora inválido.")
    }

    // Tratamento e upload do arquivo de currículo
    const arquivoCurriculo = $("ff-curriculo").files[0]
    let urlCurriculo = freela?.url_curriculo || null

    if (arquivoCurriculo) {
        if (!curriculoPermitido(arquivoCurriculo)) {
            return Auth.mostrarMensagem($("msg"), "O currículo deve ser em formato PDF ou Word.")
        }
        if (arquivoCurriculo.size > 5 * 1024 * 1024) { // limite de 5 MB
            return Auth.mostrarMensagem($("msg"), "O currículo deve ter no máximo 5 MB.")
        }

        const caminhoCurriculo = usuario.id + "/curriculo"
        const envioCurriculo = await Auth.supabase.storage
            .from("curriculo")
            .upload(caminhoCurriculo, arquivoCurriculo, {
                upsert: true,
                contentType: arquivoCurriculo.type || undefined
            })

        if (envioCurriculo.error) {
            console.error("Erro detalhado do Supabase Storage:", envioCurriculo.error)
            return Auth.mostrarMensagem($("msg"), "Erro no upload: " + envioCurriculo.error.message)
        }

        const { data: pubC } = Auth.supabase.storage.from("curriculo").getPublicUrl(caminhoCurriculo)
        urlCurriculo = pubC.publicUrl + "?v=" + Date.now() // evita cache antigo do navegador
    }

    const dados = {
        titulo: $("ff-titulo").value.trim() || null,
        valor_hora: valor,
        disponibilidade: $("ff-disp").value.trim() || null,
        nivel_experiencia: $("ff-nivel").value.trim() || null,
        idiomas: $("ff-idiomas").value.split(",").map((s) => s.trim()).filter(Boolean),
        url_curriculo: urlCurriculo
    }

    // Criar: o banco só aceita os campos descritivos (sem atualizado_em). Editar: acrescenta atualizado_em.
    const consulta = freela
        ? Auth.supabase.from("perfis_freelancer")
            .update({ ...dados, atualizado_em: new Date().toISOString() })
            .eq("perfil_id", usuario.id)
        : Auth.supabase.from("perfis_freelancer")
            .insert({ perfil_id: usuario.id, ...dados })

    const { data, error } = await consulta.select(COLUNAS_FREELA).single()
    if (error) {
        console.error("Erro ao salvar perfil profissional:", error)
        return Auth.mostrarMensagem($("msg"), "Não foi possível salvar o perfil profissional.")
    }
    Auth.limparMensagem($("msg"))
    mostrarFreela(data)
})

// ----- Início: carrega tudo ao abrir a página -----
async function iniciar() {
    usuario = await Auth.usuarioAtual()
    if (!usuario) return // o auth.js já manda para o login

    const { data, error } = await Auth.supabase
        .from("perfis").select(COLUNAS_PERFIL).eq("id", usuario.id).maybeSingle()
    if (error) return Auth.mostrarMensagem($("msg"), "Não foi possível carregar o perfil.")
    if (!data) {
        return Auth.mostrarMensagem($("msg"),
            "Sua conta ainda não tem perfil. Avise o grupo para aplicar o script 11 no Supabase.")
    }
    mostrarPerfil(data)

    // Bloco profissional só aparece para quem escolheu "Prestar serviços"
    if (Auth.obterModo() === "prestar") {
        const r = await Auth.supabase
            .from("perfis_freelancer").select(COLUNAS_FREELA).eq("perfil_id", usuario.id).maybeSingle()
        if (r.error) Auth.mostrarMensagem($("msg"), "Não foi possível carregar o perfil profissional.")
        else {
            $("cartao-freela").hidden = false
            mostrarFreela(r.data)
        }
    }
}
iniciar()

// ----- Área de criação de publicações -----

const abrirPost = $("openpost")
const botoesPost = $("botaopost")
const postPlace = $("postplace")

if (abrirPost && botoesPost && postPlace) {

    abrirPost.addEventListener("click", (e) => {
        e.preventDefault()

        // Esconde o botão enquanto o formulário estiver aberto
        botoesPost.replaceChildren()

        const aplicPost = document.createElement("div")
        aplicPost.className = "posts"

        aplicPost.innerHTML = `
            <form id="formenvio">

                <label for="tpservico">Tipo do serviço</label>
                <input
                    type="text"
                    placeholder="Tipo do serviço"
                    id="tpservico"
                    maxlength="100"
                    autocomplete="off"
                    required
                >

                <label for="vlservico">Valor do serviço (R$)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valor do serviço"
                    id="vlservico"
                >

                <button type="button" id="addlcl">
                    Adicionar local
                </button>

                <textarea
                    placeholder="Descrição do serviço"
                    id="descricao"
                    maxlength="2000"
                    required
                ></textarea>

                <button type="submit" id="publicar">
                    Publicar
                </button>

                <button type="button" id="cancelarpost">
                    Cancelar
                </button>

            </form>
        `

        postPlace.replaceChildren(aplicPost)

        const form = $("formenvio")

        // ----- Adicionar localidade -----
        const botaoLocal = $("addlcl")

        botaoLocal.addEventListener("click", (e) => {
            e.preventDefault()

            const local = document.createElement("div")

            local.innerHTML = `
                <input
                    type="text"
                    placeholder="Localidade"
                    id="itlocal"
                    maxlength="100"
                    autocomplete="off"
                >

                <button type="button" id="cancelarlocal">
                    X
                </button>
            `

            botaoLocal.replaceWith(local)

            $("cancelarlocal").addEventListener("click", () => {
                local.replaceWith(botaoLocal)
            })
        })

        // ----- Cancelar publicação -----
        $("cancelarpost").addEventListener("click", () => {
            postPlace.replaceChildren()
            botoesPost.appendChild(abrirPost)
            Auth.limparMensagem($("msg"))
        })

        // ----- Enviar publicação ao backend -----
        form.addEventListener("submit", async (e) => {
            e.preventDefault()

            const valorTexto = $("vlservico").value.trim()

            if (valorTexto !== "" &&
                (!Number.isFinite(Number(valorTexto)) || Number(valorTexto) < 0)) {
                return Auth.mostrarMensagem($("msg"), "Informe um valor válido.")
            }

            const elementopst = {
                valor: valorTexto === "" ? null : Number(valorTexto),
                servico: $("tpservico").value.trim(),
                local: $("itlocal")?.value.trim() || "",
                descricao: $("descricao").value.trim()
            }

            // Verifica se existe uma sessão autenticada
            const token = await Auth.obterToken()

            if (!token) {
                alert("Entre na sua conta para publicar um serviço.")
                window.location.href = "acesso.html"
                return
            }

            try {
                const resposta = await fetch(`${API}/projetos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(elementopst)
                })

                const resultado = await resposta.json().catch(() => ({}))

                if (!resposta.ok) {
                    Auth.mostrarMensagem(
                        $("msg"),
                        resultado.erro || "Não foi possível publicar o serviço."
                    )
                    if (resposta.status === 401) {
                        window.location.href = "acesso.html"
                    }
                    return
                }

                // Publicação realizada: fecha o formulário e mostra o aviso de sucesso
                form.reset()
                postPlace.replaceChildren()
                botoesPost.appendChild(abrirPost)
                Auth.mostrarMensagem($("msg"), "Publicação criada com sucesso!", "sucesso")

            } catch (erro) {
                console.error("Erro ao publicar serviço:", erro)
                Auth.mostrarMensagem(
                    $("msg"),
                    "Não foi possível falar com o servidor. Verifique se ele está ligado."
                )
            }
        })
    })

} else {
    console.warn("Área de publicação não encontrada no HTML.")
}