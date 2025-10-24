// renderer.js

// --- Funções Auxiliares para Manipulação da UI ---

/**
 * Exibe uma mensagem de status na interface.
 * @param {HTMLElement} element O elemento HTML onde a mensagem será exibida.
 * @param {string} message O texto da mensagem.
 * @param {'success'|'error'} type O tipo da mensagem para estilização.
 */
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = type; // Adiciona a classe CSS para estilização
    element.style.display = 'block'; // Torna o elemento visível
    // Esconde a mensagem após alguns segundos
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
        element.className = '';
    }, 5000); // Mensagem visível por 5 segundos
}

/**
 * Limpa os campos de input de grupo.
 */
function clearGroupInputs() {
    document.getElementById('groupIdInput').value = '';
    document.getElementById('groupNameInput').value = '';
}

/**
 * Renderiza a lista de grupos na interface.
 * @param {Array<Object>} groups A lista de objetos de grupo ({ id, name }).
 */
async function renderGroups(groups) {
    const groupsList = document.getElementById('groupsList');
    groupsList.innerHTML = ''; // Limpa a lista atual

    if (!groups || groups.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum grupo cadastrado ainda.';
        groupsList.appendChild(li);
        return;
    }

    groups.forEach(group => {
        const li = document.createElement('li');
        li.setAttribute('data-group-id', group.id); // Armazena o ID no elemento li
        li.innerHTML = `
            <span><strong>${group.name}</strong> (${group.id})</span>
            <button class="danger delete-group-btn" data-group-id="${group.id}">Excluir</button>
        `;
        groupsList.appendChild(li);
    });

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

/**
 * Manipula o clique no botão "Enviar Mensagem".
 */
async function sendMessageHandler() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    const messageStatus = document.getElementById('messageStatus');

    // Obtém a lista atual de grupos para enviar
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

    // Confirmação antes de enviar
    if (!confirm(`Tem certeza que deseja enviar esta mensagem para ${groupIds.length} grupo(s)?`)) {
        return;
    }

    showStatus(messageStatus, 'Enviando mensagem...', 'secondary'); // Status temporário
    try {
        // Chama a função sendMessage exposta pelo preload.js
        const response = await window.api.sendMessage(messageText, groupIds);

        if (response.success) {
            showStatus(messageStatus, '✅ Mensagem enviada com sucesso para todos os grupos!', 'success');
            messageInput.value = ''; // Limpa o campo após o envio
            // Opcional: Exibir resultados detalhados se response.data contiver
            // response.data.forEach(res => console.log(`Grupo ${res.groupId}: ${res.success ? 'Sucesso' : 'Falha - ' + res.error}`));
        } else {
            showStatus(messageStatus, `❌ Erro ao enviar mensagem: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Erro no envio da mensagem:', error);
        showStatus(messageStatus, `❌ Erro inesperado ao enviar mensagem: ${error.message}`, 'error');
    }
}

/**
 * Manipula o clique no botão "Adicionar Grupo".
 */
async function addGroupHandler() {
    const groupIdInput = document.getElementById('groupIdInput');
    const groupNameInput = document.getElementById('groupNameInput');
    const groupStatus = document.getElementById('groupStatus');

    const id = groupIdInput.value.trim();
    const name = groupNameInput.value.trim();

    if (!id || !name) {
        showStatus(groupStatus, 'Por favor, preencha o ID e o Nome do Grupo.', 'error');
        return;
    }

    try {
        // Chama a função addGroup exposta pelo preload.js
        const response = await window.api.addGroup(id, name);

        if (response.success) {
            showStatus(groupStatus, `✅ Grupo "${name}" adicionado com sucesso!`, 'success');
            clearGroupInputs(); // Limpa os campos
            loadAndRenderGroups(); // Recarrega e renderiza a lista de grupos
        } else {
            showStatus(groupStatus, `❌ Erro ao adicionar grupo: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar grupo:', error);
        showStatus(groupStatus, `❌ Erro inesperado ao adicionar grupo: ${error.message}`, 'error');
    }
}

/**
 * Manipula a exclusão de um grupo.
 * @param {string} groupId O ID do grupo a ser excluído.
 */
async function deleteGroupHandler(groupId) {
    const groupStatus = document.getElementById('groupStatus');
    try {
        // Chama a função deleteGroup exposta pelo preload.js
        const response = await window.api.deleteGroup(groupId);

        if (response.success) {
            showStatus(groupStatus, `✅ Grupo com ID "${groupId}" excluído com sucesso!`, 'success');
            loadAndRenderGroups(); // Recarrega e renderiza a lista de grupos
        } else {
            showStatus(groupStatus, `❌ Erro ao excluir grupo: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir grupo:', error);
        showStatus(groupStatus, `❌ Erro inesperado ao excluir grupo: ${error.message}`, 'error');
    }
}

/**
 * Carrega os grupos do processo principal e os renderiza na interface.
 */
async function loadAndRenderGroups() {
    const groupStatus = document.getElementById('groupStatus');
    try {
        const response = await window.api.getGroups();
        if (response.success) {
            renderGroups(response.data);
        } else {
            showStatus(groupStatus, `❌ Erro ao carregar grupos: ${response.error}`, 'error');
            renderGroups([]); // Renderiza uma lista vazia em caso de erro
        }
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        showStatus(groupStatus, `❌ Erro inesperado ao carregar grupos: ${error.message}`, 'error');
        renderGroups([]);
    }
}

// --- Inicialização ---

// Garante que o DOM esteja completamente carregado antes de adicionar os event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona os event listeners aos botões
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessageHandler);
    document.getElementById('clearMessageBtn').addEventListener('click', () => {
        document.getElementById('messageInput').value = '';
    });
    document.getElementById('addGroupBtn').addEventListener('click', addGroupHandler);

    // Carrega e renderiza os grupos assim que a interface é carregada
    loadAndRenderGroups();
});
