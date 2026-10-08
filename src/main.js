const postplace = document.getElementById("postplace");
const postarea = document.getElementById("postarea");

document.getElementById("perfil").addEventListener("click", ()=>{
    window.location.href= "perfil.html"
})


document.getElementById("openpost").addEventListener("click", () =>{ //Evento que fica analisando o botão openpost a click
    event.preventDefault();
    postplace.innerHTML=``;
    let aplic_post = document.createElement("div");
    aplic_post.className = 'posts';
    aplic_post.innerHTML = `<input type="text" placeholder="publique aqui" id="escritapst" autocomplete=off>
    <button id="publicar">Publicar</button>
    `
    postplace.appendChild(aplic_post);
    
    document.getElementById("publicar").addEventListener("click", () =>{
        event.preventDefault();
        let escritapst = document.getElementById("escritapst").value;
        const postinarea = document.createElement("div");
        postinarea.className = 'postados';
        postinarea.innerHTML=`<p>${escritapst}</p>`
        postarea.appendChild(postinarea);
    })
})