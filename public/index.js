/*******************************************
Sistema de Acompanhamento Pedagógico | Prepara LEM | 2026
Copyright © 2026 - Jorge Souza Oliveira dos Santos
Todos os direitos reservados.
https://jorgesouza.com.br | https://prepara.com.br
Para instruções de uso, downloads, versões, visite:
https://github.com/Prepara-Cursos-LEM/pedagogico_acompanhamento
Credenciais da conta Github? No drive do pedagógico, pasta senhas.
*******************************************/

const appURL = "http://192.168.0.101:9123/app";
/**
 * @description 
 */
window.addEventListener("DOMContentLoaded", () => {
    // Obter dados de usuários
    fetch(appURL + `/users`).then((res) => res.json()).then((data) => {
        console.log(data);
        const selectElement = document.getElementById("user");
        selectElement.innerHTML = "";
        Object.keys(data).forEach((user) => {
            const option = document.createElement("option");
            option.value = data[user].role;
            const titleCaseRole = data[user].role.charAt(0).toUpperCase() + data[user].role.slice(1).toLowerCase();
            option.text = titleCaseRole;
            selectElement.appendChild(option);
        });
        // password
        const verSenha = document.getElementById("ver-senha");
        const password = document.getElementById("password");
        password.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                document.getElementById("submit").click();
            } else {
                if (password.value.length < 4) {
                    password.style.borderColor = "red";
                    password.style.outlineColor = "red";
                } else {
                    password.style.borderColor = "green";
                    password.style.outlineColor = "green";
                }
            }
        });
        verSenha.addEventListener("click", () => {
            const password = document.getElementById("password");
            if (password.type === "password") {
                password.type = "text";
                password.setAttribute("placeholder", "12345678");
                verSenha.textContent = "Ocultar senha";
            } else {
                password.type = "password";
                password.setAttribute("placeholder", "••••••••");
                verSenha.textContent = "Ver senha";
            }
        });
        // fetch
        document.getElementById("submit").addEventListener("click", () => {
            const role = document.getElementById("user").value;
            const pass = document.getElementById("password").value;
            fetch(appURL + `/auth/${role}/${pass}`).then((res) => res.json()).then((data) => {
                window.location.href = `app.html?token=${data.token}&role=${data.role}`;
            });
        });
    }).catch((err) => {
        console.log(err);
        alert("Erro ao carregar dados");
    });
    document.getElementById("password").value = "Prepara12!";
});