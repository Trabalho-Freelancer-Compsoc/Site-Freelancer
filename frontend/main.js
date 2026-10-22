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
    aplic_post.innerHTML = `<input type="text" placeholder="Tipo do serviço" id ="tpservico" autocomplete=off required>
    R$<input type="text" placeholder="valor do serviço" id ="vlservico" autocomplete=off>
    <button type="button" id="addlcl">Add Local</button>
    <textarea type="text" placeholder="descrição do serviço" id="descricao" required></textarea>
    <button id="publicar">Publicar</button>
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
    
    aplic_post.querySelector("#publicar").addEventListener("click", () =>{
        event.preventDefault(); //Para prevenir carregar TEMPORÁRIO PARA TESTE !!! APAGAR DEPOIS!!!
        const postinarea = document.createElement("div");

        const elementopst = {
            valor: document.getElementById("vlservico").value || "Serviço Gratuito",
            servico: document.getElementById("tpservico").value,
            local: document.getElementById("itlocal")?.value || "Sem local especificado",
            descricao: document.getElementById("descricao").value
        };

        console.log(elementopst.descricao);
        console.log(elementopst.valor);
        console.log(elementopst.servico);
        console.log(elementopst.local);
        
        postinarea.className = 'postados';
        postinarea.innerHTML=`<div class="cabdesc>
        <span class="cabdesc">${elementopst.servico}</span>
        <span class="cabdesc">${elementopst.valor}</span>
        <span class="cabdesc">${elementopst.local}</span>
        </div>
        <span>${elementopst.descricao}</span>`
        postarea.appendChild(postinarea);
    })
})