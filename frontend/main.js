//form's e div's
const postplace = document.getElementById("postplace");
const postarea = document.getElementById("postarea");
const areapesq = document.getElementById("resultados");
//Elementos
const campobusca = document.getElementById("busca");
const botaopost = document.getElementById("botaopost");

const API = "http://localhost:3000"; //endereço do servidor (backend)
let eu = null; //quem está logado (ou null), para não mostrar "Conversar" nos próprios posts
carregarPesquisa();
let info = [];
campobusca.addEventListener('input', ()=>{
    areapesq.innerHTML ="";
    let termobusca = campobusca.value.toLowerCase();
    if(termobusca !== ""){

        info.forEach(item =>{
            console.log(item.titulo);
            let txtserv = (item.titulo ?? "").toLowerCase();
            let txtlocal = (item.localizacao ?? "").toLowerCase();
            if((txtserv.includes(termobusca) || txtlocal.includes(termobusca))){
                areapesq.appendChild(mostrarPost(item, "post-pesquisa"));
            }
        })
    }

})

function mostrarPost(projeto, visual) {
    const postinarea = document.createElement("li");
    postinarea.className = `${visual}`;
    postinarea.innerHTML=`
        <div class="postslot">
        <div class="infopost">
        <span class="servico"></span>
        <span class="valor"></span>
        <span class="local"></span>
        <span class="textodesc"></span>
        <div class="acoes">
        <button type="button" class="contratar">Contratar Serviço</button>
        <button type="button" class="conversar">Conversar</button>
        </div>
        </div>
        <div>
        `
    //textContent em vez de ${}: o texto que veio do banco aparece só como texto e nunca vira código na página
    postinarea.querySelector(".servico").textContent = projeto.titulo;
    postinarea.querySelector(".valor").textContent = projeto.orcamento_min === null
        ? "Serviço Gratuito"
        : Number(projeto.orcamento_min).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    postinarea.querySelector(".local").textContent = projeto.localizacao || "Sem local especificado";
    postinarea.querySelector(".textodesc").textContent = projeto.descricao;

    //O contratacao-link.js usa este id para abrir contratar.html?projeto=<id>
    postinarea.querySelector(".contratar").dataset.projeto = projeto.id;

    //"Conversar" abre o bate-papo com quem publicou. No próprio post, o botão não aparece
    const botaoConversar = postinarea.querySelector(".conversar");
    if (eu && eu.id === projeto.cliente_id) {
        botaoConversar.remove();
    } else {
        botaoConversar.addEventListener("click", () => abrirConversa(projeto.id, botaoConversar));
    }
    return(postinarea);
}

//Pede ao servidor a conversa deste post (cria se ainda não existe) e vai para o bate-papo
async function abrirConversa(projetoId, botao) {
    const token = await Auth.obterToken();
    if (!token) {
        alert("Entre na sua conta para conversar.");
        window.location.href = "acesso.html";
        return;
    }

    botao.disabled = true;
    try {
        const resposta = await fetch(`${API}/conversas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ projeto_id: projetoId })
        });
        const corpo = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            alert(corpo.erro || "Não foi possível abrir a conversa.");
            if (resposta.status === 401) window.location.href = "acesso.html"; //sessão expirou: entra de novo
            return;
        }
        window.location.href = "chat.html?conversa=" + encodeURIComponent(corpo.id);
    } catch {
        alert("Não foi possível falar com o servidor. Veja se ele está ligado.");
    } finally {
        botao.disabled = false;
    }
}



//Busca os posts salvos no banco (pelo servidor)

async function carregarPesquisa() {
    try {
        const resposta = await fetch(`${API}/projetos`);
        if (!resposta.ok) throw new Error();
        info = await resposta.json();
        eu = await Auth.usuarioAtual(); //null se ninguém estiver logado

        const colunas = [
            document.querySelector(".post-feed1"),
            document.querySelector(".post-feed2"),
            document.querySelector(".post-feed3")
        ];

        colunas.forEach(coluna => coluna.innerHTML = "");

        const div = Math.ceil(info.length / 3);

        info.forEach((item,index)=>{
            const coluna = Math.floor(index / div);
            
            colunas[coluna].appendChild(mostrarPost(item, "post-feed"));
        })
    } catch{
        postarea.innerHTML = `<li class="postados">Não foi possível carregar os posts. Veja se o servidor está ligado.</li>`;
    }
}

document.getElementById("perfil").addEventListener("click", ()=>{
    window.location.href= "perfil.html";
})//Adiciona uma percepção de eventos ao id do botão perfil, que ao ser clicado é direcionado para outra página

document.getElementById("chat").addEventListener("click", ()=>{
    window.location.href= "chat.html";
})//O botão Bate Papo leva para a lista de conversas