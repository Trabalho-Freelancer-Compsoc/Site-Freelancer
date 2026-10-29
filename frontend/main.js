//form's e div's
const postplace = document.getElementById("postplace");
const postarea = document.getElementById("postarea");

//Elementos
const botaopost = document.getElementById("botaopost");


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
    R$<input type="text" placeholder="valor do serviço" id ="vlservico" autocomplete=off>
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
    
    document.getElementById("formenvio").addEventListener("submit", () =>{
        event.preventDefault(); //Para prevenir carregar TEMPORÁRIO PARA TESTE !!! APAGAR DEPOIS!!!
        const postinarea = document.createElement("li");
        const elementopst = {
            valor: document.getElementById("vlservico").value.trim() || "Serviço Gratuito",
            servico: document.getElementById("tpservico").value.trim(),
            local: document.getElementById("itlocal")?.value.trim() || "Sem local especificado",
            descricao: document.getElementById("descricao").value.trim()
        };
    
        postinarea.className = 'postados';
        postinarea.innerHTML=`<div class="cabdesc>
        <span class="cabdesc">${elementopst.servico}</span>
        <span class="cabdesc">${elementopst.valor}</span>
        <span class="cabdesc">${elementopst.local}</span>
        </div>
        <span>${elementopst.descricao}</span>
        <div>
        <button id="contratar">Contratar Serviço</button>
        </div
        `
        postarea.appendChild(postinarea);
    })
})