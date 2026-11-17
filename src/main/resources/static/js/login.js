
document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");

    const csrfToken = document.getElementById("csrfToken");

    const errorMessage = document.getElementById("errorMessage");
    const logoutMessage = document.getElementById("logoutMessage");
    const systemMessage = document.getElementById("systemMessage");

    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");

    // Exibe mensagens somente quando o parâmetro correspondente existe.
    const params = new URLSearchParams(window.location.search);

    if (params.has("error")) {
        errorMessage.classList.add("show");
    }

    if (params.has("logout")) {
        logoutMessage.classList.add("show");
    }

    // Mostrar ou ocultar senha.
    togglePassword.addEventListener("click", () => {

        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";

        togglePassword.textContent = isPassword ? "Ocultar" : "Mostrar";

    });

    // Busca o token CSRF antes de permitir o envio do formulário.
    async function loadCsrfToken() {

        try {

            const response = await fetch("/api/csrf", {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Não foi possível carregar a proteção de segurança.");
            }

            const data = await response.json();

            csrfToken.value = data.token;

            loginButton.disabled = false;
            loginButton.textContent = "Entrar";

        } catch (error) {

            console.error("Erro ao carregar CSRF:", error);

            systemMessage.textContent =
                "Não foi possível preparar o login. Atualize a página e tente novamente.";

            systemMessage.classList.add("show");

            loginButton.disabled = true;
            loginButton.textContent = "Indisponível";

        }

    }

    // Evita envio sem token CSRF.
    loginForm.addEventListener("submit", (event) => {

        if (!csrfToken.value) {

            event.preventDefault();

            systemMessage.textContent =
                "Aguarde o carregamento da proteção de segurança.";

            systemMessage.classList.add("show");

            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Entrando...";

    });

    loadCsrfToken();

});
