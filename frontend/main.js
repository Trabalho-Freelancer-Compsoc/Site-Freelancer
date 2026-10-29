//form's e div's
const postplace = document.getElementById("postplace");
const postarea = document.getElementById("postarea");

//Elementos
const botaopost = document.getElementById("botaopost");

const API = "http://localhost:3000"; //endereço do servidor (backend)

//Monta um post na tela com os dados que vieram do banco
function mostrarPost(projeto) {
    const postinarea = document.createElement("li");
    postinarea.className = 'postados';
    postinarea.innerHTML=`<div class="cabdesc">
        <span class="cabdesc servico"></span>
        <span class="cabdesc valor"></span>
        <span class="cabdesc local"></span>
        </div>
        <span class="textodesc"></span>
        <div>
        <button type="button" class="contratar">Contratar Serviço</button>
        </div>
        `
    //textContent em vez de ${}: o texto que veio do banco aparece só como texto e nunca vira código na página
    postinarea.querySelector(".servico").textContent = projeto.titulo;
    postinarea.querySelector(".valor").textContent = projeto.orcamento_min === null
        ? "Serviço Gratuito"
        : Number(projeto.orcamento_min).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    postinarea.querySelector(".local").textContent = projeto.localizacao || "Sem local especificado";
    postinarea.querySelector(".textodesc").textContent = projeto.descricao;
    postarea.appendChild(postinarea);
}

//Busca os posts salvos no banco (pelo servidor) e mostra na tela
async function carregarPosts() {
    try {
        const resposta = await fetch(`${API}/projetos`);
        if (!resposta.ok) throw new Error();
        const projetos = await resposta.json();
        postarea.innerHTML = ``; //limpa a lista antes de mostrar de novo
        projetos.forEach(mostrarPost);
    } catch {
        postarea.innerHTML = `<li class="postados">Não foi possível carregar os posts. Veja se o servidor está ligado.</li>`;
    }
}

carregarPosts(); //mostra os posts assim que a página abre


document.getElementById("perfil").addEventListener("click", ()=>{
    window.location.href= "perfil.html";
})//Adiciona uma percepção de eventos ao id do botão perfil, que ao ser clicado é direcionado para outra página

document.getElementById("openpost").addEventListener("click", () =>{ //Evento que fica analisando o botão openpost pelo click
    event.preventDefault();//evita que a página recarregue
    botaopost.innerHTML=``;
    let aplic_post = document.createElement("div");
    aplic_post.className = 'posts';
    aplic_post.innerHTML = `<form id="formenvio">
    <input type="text" placeholder="Tipo do serviço" id ="tpservico" autocomplete=off required>
    R$<input type="number" min="0" step="0.01" placeholder="valor do serviço" id ="vlservico" autocomplete=off>
    <button type="button" id="addlcl">Add Local</button>
    <textarea type="text" placeholder="descrição do serviço" id="descricao" required></textarea>
    <button type="submit" id="publicar">Publicar</button>
    </form>
    `
    postplace.appendChild(aplic_post);
    
    
    document.getElementById("addlcl").addEventListener("click", () =>{//Evento que fica analisando o botão de localidade
        event.preventDefault();
        let local = document.createElement("div");//cria uma novo elemento, que adiciona os elementos abaixo
        local.innerHTML=`<input type="text" placeholder="Localidade" id="itlocal">
        <button type="button" id="cancelarlocal">X</button>
        `
        
        let botao = document.getElementById("addlcl");
        document.getElementById("addlcl").replaceWith(local); //substitui o elemento de botão por outro
        
        document.getElementById("cancelarlocal").addEventListener("click",()=>{//elemento que desfaz a troca
            local.replaceWith(botao);
        })
        
    })
    
    document.getElementById("formenvio").addEventListener("submit", async (e) =>{
        e.preventDefault(); //evita que a página recarregue: quem salva o post agora é o servidor
        const elementopst = {
            valor: document.getElementById("vlservico").value.trim(),
            servico: document.getElementById("tpservico").value.trim(),
            local: document.getElementById("itlocal")?.value.trim() || "",
            descricao: document.getElementById("descricao").value.trim()
        };

        try {
            //Envia o post para o servidor, que salva no banco
            const resposta = await fetch(`${API}/projetos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(elementopst)
            });

            if (!resposta.ok) {
                const falha = await resposta.json();
                alert(falha.erro);
                return;
            }
        } catch {
            alert("Não foi possível falar com o servidor. Veja se ele está ligado.");
            return;
        }

        e.target.reset(); //limpa os campos
        carregarPosts(); //busca de novo no banco, já com o post novo
    })
})