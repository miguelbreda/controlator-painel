
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");
    const button = document.getElementById("registerButton");

    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    const csrfToken = document.getElementById("csrfToken");

    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add("show");
        successMessage.classList.remove("show");
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add("show");
        errorMessage.classList.remove("show");
    }

    function clearMessages() {
        errorMessage.textContent = "";
        successMessage.textContent = "";

        errorMessage.classList.remove("show");
        successMessage.classList.remove("show");
    }

    // Carrega o token CSRF.
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

            button.disabled = false;
            button.textContent = "Criar conta";

        } catch (error) {

            console.error(error);

            showError("Não foi possível preparar o cadastro. Atualize a página.");

            button.disabled = true;
            button.textContent = "Indisponível";

        }
    }

    // Envia os dados para o Spring Boot.
    form.addEventListener("submit", async (event) => {

        event.preventDefault();
        clearMessages();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (username.length < 3 || username.length > 80) {
            showError("O usuário precisa ter entre 3 e 80 caracteres.");
            return;
        }

        if (password.length < 12) {
            showError("A senha precisa ter pelo menos 12 caracteres.");
            return;
        }

        if (new TextEncoder().encode(password).length > 72) {
            showError("A senha ultrapassa o limite permitido de 72 bytes.");
            return;
        }

        if (password !== confirmPassword) {
            showError("As senhas não são iguais.");
            return;
        }

        if (!csrfToken.value) {
            showError("A proteção de segurança ainda não foi carregada.");
            return;
        }

        button.disabled = true;
        button.textContent = "Criando conta...";

        try {

            const response = await fetch("/api/auth/register", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRF-TOKEN": csrfToken.value
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            const responseText = await response.text();

            let data = {};

            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = {};
            }

            if (!response.ok) {

                const message =
                    data.message ||
                    data.detail ||
                    data.error ||
                    (response.status === 409
                        ? "Este usuário ou e-mail já está cadastrado."
                        : `Não foi possível criar a conta. Erro ${response.status}.`);

                throw new Error(message);
            }

            showSuccess("Conta criada com sucesso! Você já pode fazer login.");

            form.reset();

            button.textContent = "Conta criada";

            // Atualiza o token para evitar reutilização de token antigo.
            await loadCsrfToken();

        } catch (error) {

            console.error("Erro no cadastro:", error);

            showError(error.message || "Ocorreu um erro ao criar sua conta.");

            button.disabled = false;
            button.textContent = "Criar conta";

        }

    });

    loadCsrfToken();

});
