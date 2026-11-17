const API = "/api";
const LOW_STOCK_LIMIT = 5;
const VIEWS = ["dashboard", "products", "stock", "prices"];

let allProducts = [];
let editingProductId = null;

const $ = (id) => document.getElementById(id);

function formatCurrency(value) {
    return Number(value ?? 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("pt-BR");
}

function showToast(message, type = "success") {
    const region = $("toastRegion");
    const toast = document.createElement("div");

    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.textContent = message;

    region.appendChild(toast);

    window.setTimeout(() => toast.remove(), 3500);
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        let message = `Erro na requisição (${response.status}).`;

        try {
            const data = await response.json();
            message = data.detail || data.message || data.error || message;
        } catch (_) {}

        throw new Error(message);
    }

    if (response.status === 204) return null;

    const body = await response.text();
    return body ? JSON.parse(body) : null;
}

function setButtonBusy(button, busy, busyLabel = "Salvando...") {
    if (!button) return;

    if (busy) {
        button.dataset.previousLabel = button.textContent;
        button.textContent = busyLabel;
        button.disabled = true;
    } else {
        button.textContent = button.dataset.previousLabel || button.textContent;
        button.disabled = false;
    }
}

function addCell(row, value) {
    const cell = document.createElement("td");

    cell.textContent = value == null ? "" : String(value);
    row.appendChild(cell);

    return cell;
}

function setTableMessage(tableId, columns, message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = columns;
    cell.className = "empty-cell";
    cell.textContent = message;

    row.appendChild(cell);
    $(tableId).replaceChildren(row);
}

function createAction(label, callback, className = "small-button") {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", callback);

    return button;
}

// NAVEGAÇÃO

function navigate(view) {
    if (!VIEWS.includes(view)) view = "dashboard";

    VIEWS.forEach(name => {
        const section = $(`${name}-view`);

        if (section) {
            section.classList.toggle("view-hidden", name !== view);
        }
    });

    document.querySelectorAll(".nav-item[data-view]").forEach(item => {
        item.classList.toggle("active", item.dataset.view === view);
    });

    const labels = {
        dashboard: "Visão geral",
        products: "Produtos",
        stock: "Estoque",
        prices: "Preços"
    };

    const breadcrumb = $("breadcrumbCurrent");

    if (breadcrumb) {
        breadcrumb.textContent = labels[view];
    }

    history.replaceState(null, "", `#${view}`);

    if (view === "dashboard") refreshDashboard();
    if (view === "products") loadProductsPage();
    if (view === "stock") loadStockPage();
    if (view === "prices") loadPricesPage();

    $("sidebar")?.classList.remove("mobile-open");
}

document.querySelectorAll(".nav-item[data-view]").forEach(item => {
    item.addEventListener("click", event => {
        event.preventDefault();
        navigate(item.dataset.view);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.go));
});

$("mobileMenu")?.addEventListener("click", () => {
    $("sidebar")?.classList.toggle("mobile-open");
});

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        $(button.dataset.close)?.close();
    });
});

// DASHBOARD

async function refreshDashboard() {
    try {
        const [dashboard, products] = await Promise.all([
            apiRequest(`${API}/dashboard`),
            apiRequest(`${API}/products`)
        ]);

        $("totalProducts").textContent = dashboard.totalProducts ?? 0;
        $("totalUnits").textContent = dashboard.totalUnits ?? 0;
        $("inventoryValue").textContent =
            formatCurrency(dashboard.totalInventoryValue);
        $("lowStockCount").textContent = dashboard.lowStockCount ?? 0;

        renderDashboardProducts(products);
        renderLowStock(dashboard.lowStockProducts || []);

    } catch (error) {
        console.error(error);

        showToast(
            error.message || "Não foi possível carregar o painel.",
            "error"
        );

        setTableMessage(
            "productsTable",
            4,
            "Não foi possível carregar os produtos."
        );
    }
}

function renderDashboardProducts(products) {
    const table = $("productsTable");
    table.replaceChildren();

    if (!products.length) {
        return setTableMessage(
            "productsTable",
            4,
            "Nenhum produto cadastrado."
        );
    }

    products.slice(0, 6).forEach(product => {
        const row = document.createElement("tr");

        addCell(row, product.name);
        addCell(row, product.category);
        addCell(row, formatCurrency(product.price));
        addCell(row, product.stock);

        table.appendChild(row);
    });
}

function renderLowStock(products) {
    const container = $("lowStockList");
    container.replaceChildren();

    if (!products.length) {
        const empty = document.createElement("p");

        empty.className = "empty-message";
        empty.textContent = "Nenhum produto com estoque baixo.";

        container.appendChild(empty);
        return;
    }

    products.forEach(product => {
        const item = document.createElement("div");
        item.className = "low-stock-item";

        const name = document.createElement("strong");
        name.textContent = product.name;

        const detail = document.createElement("span");
        detail.textContent = `Estoque disponível: ${product.stock}`;

        item.append(name, detail);
        container.appendChild(item);
    });
}

// CARREGAMENTO E FILTRO DE PRODUTOS

async function fetchProducts() {
    allProducts = await apiRequest(`${API}/products`);
    return allProducts;
}

function filterProducts(products, query, fields = ["name", "code", "category"]) {
    const term = (query || "").trim().toLowerCase();

    if (!term) return products;

    return products.filter(product =>
        fields.some(field =>
            String(product[field] ?? "").toLowerCase().includes(term)
        )
    );
}

// PÁGINA DE PRODUTOS

async function loadProductsPage() {
    $("managementProductsTable").innerHTML =
        '<tr><td colspan="6" class="loading-cell">Carregando produtos...</td></tr>';

    try {
        await fetchProducts();

        $("productCount").textContent =
            `${allProducts.length} produto(s) cadastrado(s)`;

        renderProductsTable(
            filterProducts(allProducts, $("productSearch").value)
        );

    } catch (error) {
        setTableMessage("managementProductsTable", 6, error.message);
    }
}

function renderProductsTable(products) {
    const table = $("managementProductsTable");
    table.replaceChildren();

    if (!products.length) {
        return setTableMessage(
            "managementProductsTable",
            6,
            "Nenhum produto encontrado."
        );
    }

    products.forEach(product => {
        const row = document.createElement("tr");

        addCell(row, product.name);
        addCell(row, product.code);
        addCell(row, product.category);
        addCell(row, formatCurrency(product.price));
        addCell(row, product.stock);

        const actions = document.createElement("td");
        const group = document.createElement("div");

        group.className = "action-group";

        group.append(
            createAction("Editar", () => openProductDialog(product)),

            createAction("Estoque", () => {
                navigate("stock");
                openStockDialog(product.id);
            }),

            createAction(
                "Apagar",
                () => archiveProduct(product),
                "small-button danger"
            )
        );

        actions.appendChild(group);
        row.appendChild(actions);
        table.appendChild(row);
    });
}

$("productSearch").addEventListener("input", event => {
    renderProductsTable(
        filterProducts(allProducts, event.target.value)
    );
});

function openProductDialog(product = null) {
    editingProductId = product?.id ?? null;

    $("productForm").reset();
    $("productFormMessage").textContent = "";

    $("productDialogTitle").textContent =
        product ? "Editar produto" : "Novo produto";

    $("saveProduct").textContent =
        product ? "Salvar alterações" : "Cadastrar produto";

    $("productPrice").disabled = Boolean(product);
    $("productStock").disabled = Boolean(product);
    $("productEditHint").hidden = !product;

    if (product) {
        $("productName").value = product.name;
        $("productCode").value = product.code;
        $("productCategory").value = product.category;
        $("productPrice").value = product.price;
        $("productStock").value = product.stock;
    }

    $("productDialog").showModal();
}

$("openProductDialog").addEventListener("click", () => {
    openProductDialog();
});

$("productForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = $("saveProduct");
    const message = $("productFormMessage");

    const product = {
        name: $("productName").value.trim(),
        code: $("productCode").value.trim(),
        category: $("productCategory").value.trim(),
        price: Number($("productPrice").value),
        stock: Number($("productStock").value)
    };

    if (
        !product.name ||
        !product.code ||
        !product.category ||
        (
            !editingProductId &&
            (
                !Number.isFinite(product.price) ||
                product.price <= 0 ||
                !Number.isInteger(product.stock) ||
                product.stock < 0
            )
        )
    ) {
        message.textContent = "Confira os campos informados.";
        return;
    }

    setButtonBusy(button, true);
    message.textContent = "";

    try {
        await apiRequest(
            editingProductId
                ? `${API}/products/${editingProductId}`
                : `${API}/products`,
            {
                method: editingProductId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            }
        );

        $("productDialog").close();

        showToast(
            editingProductId
                ? "Produto atualizado!"
                : "Produto cadastrado!"
        );

        await loadProductsPage();
        await refreshDashboard();

    } catch (error) {
        message.textContent = error.message;

    } finally {
        setButtonBusy(button, false);
    }
});

// ARQUIVAR PRODUTO

async function archiveProduct(product) {
    const confirmed = window.confirm(
        `Deseja arquivar o produto "${product.name}"?`
    );

    if (!confirmed) return;

    try {
        await apiRequest(`${API}/products/${product.id}/archive`, {
            method: "PATCH"
        });

        showToast("Produto arquivado com sucesso!");

        await loadProductsPage();
        await refreshDashboard();

    } catch (error) {
        showToast(error.message, "error");
    }
}

// PÁGINA DE ESTOQUE

async function loadStockPage() {
    $("stockProductsTable").innerHTML =
        '<tr><td colspan="5" class="loading-cell">Carregando estoque...</td></tr>';

    try {
        await fetchProducts();

        $("stockCount").textContent =
            `${allProducts.length} produto(s)`;

        renderStockProducts(
            filterProducts(
                allProducts,
                $("stockSearch").value,
                ["name", "code"]
            )
        );

        populateStockSelect();

    } catch (error) {
        setTableMessage("stockProductsTable", 5, error.message);
    }
}

function renderStockProducts(products) {
    const table = $("stockProductsTable");
    table.replaceChildren();

    if (!products.length) {
        return setTableMessage(
            "stockProductsTable",
            5,
            "Nenhum produto encontrado."
        );
    }

    products.forEach(product => {
        const row = document.createElement("tr");

        addCell(row, product.name);
        addCell(row, product.code);
        addCell(row, product.stock);

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className =
            product.stock <= LOW_STOCK_LIMIT
                ? "status-badge warning"
                : "status-badge success";

        badge.textContent =
            product.stock <= LOW_STOCK_LIMIT
                ? "Estoque baixo"
                : "Disponível";

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        const actions = document.createElement("td");
        const group = document.createElement("div");

        group.className = "action-group";

        group.append(
            createAction(
                "Movimentar",
                () => openStockDialog(product.id)
            ),

            createAction(
                "Histórico",
                () => loadStockHistory(product.id, product.name)
            )
        );

        actions.appendChild(group);
        row.appendChild(actions);
        table.appendChild(row);
    });
}

$("stockSearch").addEventListener("input", event => {
    renderStockProducts(
        filterProducts(
            allProducts,
            event.target.value,
            ["name", "code"]
        )
    );
});

function populateStockSelect(selectedId = null) {
    const select = $("stockProduct");

    select.replaceChildren();

    allProducts.forEach(product => {
        const option = document.createElement("option");

        option.value = product.id;
        option.textContent = `${product.name} (${product.stock} un.)`;

        if (
            selectedId != null &&
            String(selectedId) === String(product.id)
        ) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}

function openStockDialog(productId = null) {
    $("stockForm").reset();
    $("stockFormMessage").textContent = "";

    populateStockSelect(productId);

    if (!allProducts.length) {
        showToast(
            "Cadastre um produto antes de movimentar o estoque.",
            "error"
        );
        return;
    }

    $("stockDialog").showModal();
}

$("openStockDialog").addEventListener("click", () => {
    openStockDialog();
});

$("stockForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = $("saveStock");
    const message = $("stockFormMessage");

    const id = $("stockProduct").value;
    const type = $("stockType").value;
    const quantity = Number($("stockQuantity").value);

    if (!id || !Number.isInteger(quantity) || quantity <= 0) {
        message.textContent =
            "Selecione um produto e informe uma quantidade válida.";
        return;
    }

    setButtonBusy(button, true, "Registrando...");

    try {
        await apiRequest(
            `${API}/products/${id}/stock/${type}?quantity=${encodeURIComponent(quantity)}`,
            {
                method: "POST"
            }
        );

        $("stockDialog").close();

        showToast(
            type === "entry"
                ? "Entrada registrada!"
                : "Saída registrada!"
        );

        await loadStockPage();
        await refreshDashboard();

        const product = allProducts.find(
            item => String(item.id) === String(id)
        );

        if (product) {
            await loadStockHistory(id, product.name);
        }

    } catch (error) {
        message.textContent = error.message;

    } finally {
        setButtonBusy(button, false);
    }
});

async function loadStockHistory(productId, productName) {
    $("stockHistoryTitle").textContent =
        `Movimentações de ${productName}`;

    $("stockHistoryTable").innerHTML =
        '<tr><td colspan="4" class="loading-cell">Carregando histórico...</td></tr>';

    try {
        const history = await apiRequest(
            `${API}/products/${productId}/stock/history`
        );

        const table = $("stockHistoryTable");
        table.replaceChildren();

        if (!history.length) {
            return setTableMessage(
                "stockHistoryTable",
                4,
                "Nenhuma movimentação registrada."
            );
        }

        history.forEach(item => {
            const row = document.createElement("tr");

            addCell(row, formatDate(item.createdAt));
            addCell(row, item.product?.name || productName);

            addCell(
                row,
                item.type === "ENTRY" ? "Entrada" : "Saída"
            );

            addCell(row, item.quantity);

            table.appendChild(row);
        });

    } catch (error) {
        setTableMessage("stockHistoryTable", 4, error.message);
    }
}

// PÁGINA DE PREÇOS

async function loadPricesPage() {
    $("priceProductsTable").innerHTML =
        '<tr><td colspan="5" class="loading-cell">Carregando preços...</td></tr>';

    try {
        await fetchProducts();

        $("priceCount").textContent =
            `${allProducts.length} produto(s)`;

        renderPriceProducts(
            filterProducts(
                allProducts,
                $("priceSearch").value,
                ["name", "code"]
            )
        );

    } catch (error) {
        setTableMessage("priceProductsTable", 5, error.message);
    }
}

function renderPriceProducts(products) {
    const table = $("priceProductsTable");
    table.replaceChildren();

    if (!products.length) {
        return setTableMessage(
            "priceProductsTable",
            5,
            "Nenhum produto encontrado."
        );
    }

    products.forEach(product => {
        const row = document.createElement("tr");

        addCell(row, product.name);
        addCell(row, product.code);
        addCell(row, formatCurrency(product.price));
        addCell(row, product.stock);

        const actions = document.createElement("td");
        const group = document.createElement("div");

        group.className = "action-group";

        group.append(
            createAction(
                "Alterar preço",
                () => openPriceDialog(product)
            ),

            createAction(
                "Histórico",
                () => loadPriceHistory(product.id, product.name)
            )
        );

        actions.appendChild(group);
        row.appendChild(actions);
        table.appendChild(row);
    });
}

$("priceSearch").addEventListener("input", event => {
    renderPriceProducts(
        filterProducts(
            allProducts,
            event.target.value,
            ["name", "code"]
        )
    );
});

function openPriceDialog(product) {
    $("priceForm").reset();
    $("priceFormMessage").textContent = "";

    $("priceProductId").value = product.id;

    $("priceProductLabel").textContent =
        `${product.name} • preço atual: ${formatCurrency(product.price)}`;

    $("newProductPrice").value = product.price;

    $("priceDialog").showModal();
}

$("priceForm").addEventListener("submit", async event => {
    event.preventDefault();

    const button = $("savePrice");
    const message = $("priceFormMessage");

    const id = $("priceProductId").value;
    const newPrice = Number($("newProductPrice").value);

    if (!Number.isFinite(newPrice) || newPrice <= 0) {
        message.textContent = "Informe um preço maior que zero.";
        return;
    }

    setButtonBusy(button, true, "Salvando...");

    try {
        await apiRequest(
            `${API}/products/${id}/price?newPrice=${encodeURIComponent(newPrice)}`,
            {
                method: "PUT"
            }
        );

        $("priceDialog").close();

        showToast("Preço atualizado e histórico registrado!");

        await loadPricesPage();
        await refreshDashboard();

        const product = allProducts.find(
            item => String(item.id) === String(id)
        );

        if (product) {
            await loadPriceHistory(id, product.name);
        }

    } catch (error) {
        message.textContent = error.message;

    } finally {
        setButtonBusy(button, false);
    }
});

async function loadPriceHistory(productId, productName) {
    $("priceHistoryTitle").textContent =
        `Alterações de ${productName}`;

    $("priceHistoryTable").innerHTML =
        '<tr><td colspan="4" class="loading-cell">Carregando histórico...</td></tr>';

    try {
        const history = await apiRequest(
            `${API}/products/${productId}/price/history`
        );

        const table = $("priceHistoryTable");
        table.replaceChildren();

        if (!history.length) {
            return setTableMessage(
                "priceHistoryTable",
                4,
                "Nenhuma alteração de preço registrada."
            );
        }

        history.forEach(item => {
            const row = document.createElement("tr");

            addCell(row, formatDate(item.changedAt));
            addCell(row, item.product?.name || productName);
            addCell(row, formatCurrency(item.oldPrice));
            addCell(row, formatCurrency(item.newPrice));

            table.appendChild(row);
        });

    } catch (error) {
        setTableMessage("priceHistoryTable", 4, error.message);
    }
}

// CARREGAR DADOS DA CONTA AUTENTICADA

async function loadCurrentUser() {
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                `Não foi possível carregar os dados do usuário (${response.status}).`
            );
        }

        const user = await response.json();

        const username = String(
            user.username || "Usuário"
        ).trim();

        const firstLetter = username
            .charAt(0)
            .toLocaleUpperCase("pt-BR");

        const roleName =
            user.role === "ADMIN"
                ? "Administrador"
                : "Usuário";

        const sidebarAvatar = $("sidebarUserAvatar");
        const sidebarUsername = $("sidebarUsername");
        const sidebarRole = $("sidebarUserRole");
        const topbarAvatar = $("topbarUserAvatar");

        if (sidebarAvatar) {
            sidebarAvatar.textContent = firstLetter;
        }

        if (sidebarUsername) {
            sidebarUsername.textContent = username;
        }

        if (sidebarRole) {
            sidebarRole.textContent = roleName;
        }

        if (topbarAvatar) {
            topbarAvatar.textContent = firstLetter;
        }

    } catch (error) {
        console.error(
            "Erro ao carregar dados do usuário:",
            error
        );

        const sidebarUsername = $("sidebarUsername");
        const sidebarRole = $("sidebarUserRole");

        if (sidebarUsername) {
            sidebarUsername.textContent = "Usuário";
        }

        if (sidebarRole) {
            sidebarRole.textContent = "Conta";
        }
    }
}

// ESTADO INICIAL

loadCurrentUser();

const initialView = location.hash.replace("#", "");

navigate(
    VIEWS.includes(initialView)
        ? initialView
        : "dashboard"
);