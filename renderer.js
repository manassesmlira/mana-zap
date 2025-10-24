// renderer.js

// --- Funções Auxiliares para Manipulação da UI ---

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = type;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
        element.className = '';
    }, 5000);
}

function clearGroupInputs() {
    document.getElementById('groupIdInput').value = '';
    document.getElementById('groupNameInput').value = '';
    document.getElementById('groupCategoryInput').value = ''; // Limpa o novo campo de categoria
}

/**
 * Renderiza a lista de grupos na interface, agora exibindo a categoria.
 * @param {Array<Object>} groups A lista de objetos de grupo ({ id, name, category }).
 */
async function renderGroups(groups) {
    const groupsList = document.getElementById('groupsList');
    groupsList.innerHTML = '';

    if (!groups || groups.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum grupo cadastrado ainda.';
        groupsList.appendChild(li);
        return;
    }

    // Opcional: Agrupar por categoria antes de renderizar
    const groupedGroups = groups.reduce((acc, group) => {
        const category = group.category || 'Sem Categoria'; // Garante uma categoria padrão
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(group);
        return acc;
    }, {});

    // Renderiza os grupos agrupados
    for (const category in groupedGroups) {
        const categoryHeader = document.createElement('h4');
        categoryHeader.textContent = category;
        categoryHeader.style.marginTop = '15px';
        categoryHeader.style.marginBottom = '5px';
        categoryHeader.style.color = '#34495e';
        groupsList.appendChild(categoryHeader);

        groupedGroups[category].forEach(group => {
            const li = document.createElement('li');
            li.setAttribute('data-group-id', group.id);
            li.innerHTML = `
                <span>
                    <strong>${group.name}</strong> (${group.id})
                    <span class="group-category">[${group.category || 'Sem Categoria'}]</span>
                </span>
                <button class="danger delete-group-btn" data-group-id="${group.id}">Excluir</button>
            `;
            groupsList.appendChild(li);
        });
    }

    // Adiciona event listeners para os botões de exclusão
    document.querySelectorAll('.delete-group-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const groupIdToDelete = event.target.dataset.groupId;
            if (confirm(`Tem certeza que deseja excluir o grupo "${groupIdToDelete}"?`)) {
                await deleteGroupHandler(groupIdToDelete);
            }
        });
    });
}

// --- Manipuladores de Eventos ---

async function sendMessageHandler() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    const messageStatus = document.getElementById('messageStatus');

    const groupsResponse = await window.api.getGroups();
    if (!groupsResponse.success) {
        showStatus(messageStatus, `Erro ao obter grupos para envio: ${groupsResponse.error}`, 'error');
        return;
    }
    const groupIds = groupsResponse.data.map(g => g.id);

    if (!messageText) {
        showStatus(messageStatus, 'Por favor, digite uma mensagem para enviar.', 'error');
        return;
    }
    if (groupIds.length === 0) {
        showStatus(messageStatus, 'Nenhum grupo cadastrado. Adicione grupos antes de enviar.', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja enviar esta mensagem para ${groupIds.length} grupo(s)?`)) {
        return;
    }

    showStatus(messageStatus, 'Enviando mensagem...', 'secondary');
    try {
        const response = await window.api.sendMessage(messageText, groupIds);

        if (response.success) {
            showStatus(messageStatus, '✅ Mensagem enviada com sucesso para todos os grupos!', 'success');
            messageInput.value = '';
        } else {
            showStatus(messageStatus, `❌ Erro ao enviar mensagem: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Erro no envio da mensagem:', error);
        showStatus(messageStatus, `❌ Erro inesperado ao enviar mensagem: ${error.message}`, 'error');
    }
}

/**
 * Manipula o clique no botão "Adicionar Grupo", agora capturando a categoria.
 */
async function addGroupHandler() {
    const groupIdInput = document.getElementById('groupIdInput');
    const groupNameInput = document.getElementById('groupNameInput');
    const groupCategoryInput = document.getElementById('groupCategoryInput'); // Novo input
    const groupStatus = document.getElementById('groupStatus');

    const id = groupIdInput.value.trim();
    const name = groupNameInput.value.trim();
    const category = groupCategoryInput.value.trim(); // Captura o valor da categoria

    if (!id || !name || !category) { // Validação para a categoria
        showStatus(groupStatus, 'Por favor, preencha o ID, o Nome e a Categoria do Grupo.', 'error');
        return;
    }

    try {
        // Chama a função addGroup exposta pelo preload.js, passando a categoria
        const response = await window.api.addGroup(id, name, category);

        if (response.success) {
            showStatus(groupStatus, `✅ Grupo "${name}" (${category}) adicionado com sucesso!`, 'success');
            clearGroupInputs();
            loadAndRenderGroups();
        } else {
            showStatus(groupStatus, `❌ Erro ao adicionar grupo: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar grupo:', error);
        showStatus(groupStatus, `❌ Erro inesperado ao adicionar grupo: ${error.message}`, 'error');
    }
}

async function deleteGroupHandler(groupId) {
    const groupStatus = document.getElementById('groupStatus');
    try {
        const response = await window.api.deleteGroup(groupId);

        if (response.success) {
            showStatus(groupStatus, `✅ Grupo com ID "${groupId}" excluído com sucesso!`, 'success');
            loadAndRenderGroups();
        } else {
            showStatus(groupStatus, `❌ Erro ao excluir grupo: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir grupo:', error);
        showStatus(groupStatus, `❌ Erro inesperado ao excluir grupo: ${error.message}`, 'error');
    }
}

async function loadAndRenderGroups() {
    const groupStatus = document.getElementById('groupStatus');
    try {
        const response = await window.api.getGroups();
        if (response.success) {
            renderGroups(response.data);
        } else {
            showStatus(groupStatus, `❌ Erro ao carregar grupos: ${response.error}`, 'error');
            renderGroups([]);
        }
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        showStatus(groupStatus, `❌ Erro inesperado ao carregar grupos: ${error.message}`, 'error');
        renderGroups([]);
    }
}

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessageHandler);
    document.getElementById('clearMessageBtn').addEventListener('click', () => {
        document.getElementById('messageInput').value = '';
    });
    document.getElementById('addGroupBtn').addEventListener('click', addGroupHandler);

    loadAndRenderGroups();
});
