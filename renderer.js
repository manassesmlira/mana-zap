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
    document.getElementById('groupCategoryInput').value = '';
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

    const groupedGroups = groups.reduce((acc, group) => {
        const category = group.category || 'Sem Categoria';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(group);
        return acc;
    }, {});

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

    document.querySelectorAll('.delete-group-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const groupIdToDelete = event.target.dataset.groupId;
            if (confirm(`Tem certeza que deseja excluir o grupo "${groupIdToDelete}"?`)) {
                await deleteGroupHandler(groupIdToDelete);
            }
        });
    });
}

/**
 * Popula o dropdown de seleção de categorias para envio de mensagens.
 * @param {Array<Object>} groups A lista completa de grupos.
 */
function populateCategoryFilter(groups) {
    const categoryFilterSelect = document.getElementById('categoryFilterSelect');
    categoryFilterSelect.innerHTML = '<option value="all">Todos os Grupos</option>';

    const uniqueCategories = [...new Set(groups.map(group => group.category).filter(Boolean))];
    uniqueCategories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilterSelect.appendChild(option);
    });
}

// --- Manipuladores de Eventos ---

/**
 * Manipula o clique no botão "Enviar Mensagem", agora com filtro por categoria e intervalo.
 */
async function sendMessageHandler() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    const messageStatus = document.getElementById('messageStatus');
    const categoryFilterSelect = document.getElementById('categoryFilterSelect');
    const selectedCategory = categoryFilterSelect.value;
    const sendIntervalInput = document.getElementById('sendIntervalInput');
    let intervalInSeconds = parseInt(sendIntervalInput.value, 10);

    if (isNaN(intervalInSeconds) || intervalInSeconds < 13) {
        showStatus(messageStatus, 'O intervalo de envio deve ser um número e no mínimo 13 segundos.', 'error');
        sendIntervalInput.value = 13;
        return;
    }

    const groupsResponse = await window.api.getGroups();
    if (!groupsResponse.success) {
        showStatus(messageStatus, `Erro ao obter grupos para envio: ${groupsResponse.error}`, 'error');
        return;
    }
    let allGroups = groupsResponse.data;

    let groupsToSend = [];
    if (selectedCategory === 'all') {
        groupsToSend = allGroups;
    } else {
        groupsToSend = allGroups.filter(group => group.category === selectedCategory);
    }

    const groupIds = groupsToSend.map(g => g.id);

    if (!messageText) {
        showStatus(messageStatus, 'Por favor, digite uma mensagem para enviar.', 'error');
        return;
    }
    if (groupIds.length === 0) {
        showStatus(messageStatus, `Nenhum grupo encontrado na categoria "${selectedCategory}".`, 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja enviar esta mensagem para ${groupIds.length} grupo(s) da categoria "${selectedCategory}" com intervalo de ${intervalInSeconds} segundos?`)) {
        return;
    }

    showStatus(messageStatus, 'Enviando mensagem...', 'secondary');
    try {
        const response = await window.api.sendMessage(messageText, groupIds, intervalInSeconds);

        if (response.success) {
            showStatus(messageStatus, `✅ Mensagem enviada com sucesso para ${groupIds.length} grupo(s)!`, 'success');
            messageInput.value = '';
        } else {
            showStatus(messageStatus, `❌ Erro ao enviar mensagem: ${response.error}`, 'error');
        }
    } catch (error) {
        console.error('Erro no envio da mensagem:', error);
        showStatus(messageStatus, `❌ Erro inesperado ao enviar mensagem: ${error.message}`, 'error');
    }
}

async function addGroupHandler() {
    const groupIdInput = document.getElementById('groupIdInput');
    const groupNameInput = document.getElementById('groupNameInput');
    const groupCategoryInput = document.getElementById('groupCategoryInput');
    const groupStatus = document.getElementById('groupStatus');

    const id = groupIdInput.value.trim();
    const name = groupNameInput.value.trim();
    const category = groupCategoryInput.value.trim();

    if (!id || !name || !category) {
        showStatus(groupStatus, 'Por favor, preencha o ID, o Nome e a Categoria do Grupo.', 'error');
        return;
    }

    try {
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

/**
 * Manipula a importação em massa de grupos via copiar e colar.
 */
async function bulkAddGroupsHandler() {
    const bulkGroupIdsInput = document.getElementById('bulkGroupIdsInput');
    const groupCategoryInput = document.getElementById('groupCategoryInput'); // Reutiliza o campo de categoria
    const groupStatus = document.getElementById('groupStatus');

    const rawIds = bulkGroupIdsInput.value.trim();
    const category = groupCategoryInput.value.trim();

    if (!rawIds) {
        showStatus(groupStatus, 'Por favor, cole os IDs dos grupos na área de texto.', 'error');
        return;
    }
    if (!category) {
        showStatus(groupStatus, 'Por favor, preencha a Categoria do Grupo para os grupos importados.', 'error');
        return;
    }

    // Divide os IDs por linha, filtra linhas vazias e remove espaços em branco
    const idsToImport = rawIds.split('\n')
                               .map(id => id.trim())
                               .filter(id => id !== '');

    if (idsToImport.length === 0) {
        showStatus(groupStatus, 'Nenhum ID de grupo válido encontrado para importar.', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja adicionar ${idsToImport.length} grupo(s) à categoria "${category}"?`)) {
        return;
    }

    showStatus(groupStatus, `Adicionando ${idsToImport.length} grupos...`, 'secondary');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < idsToImport.length; i++) {
        const id = idsToImport[i];
        const defaultName = `Grupo Importado ${i + 1}`; // Nome padrão para grupos importados

        try {
            const response = await window.api.addGroup(id, defaultName, category);
            if (response.success) {
                successCount++;
            } else {
                failCount++;
                console.error(`Falha ao adicionar grupo ${id}: ${response.error}`);
            }
        } catch (error) {
            failCount++;
            console.error(`Erro inesperado ao adicionar grupo ${id}: ${error.message}`);
        }
    }

    if (successCount > 0) {
        showStatus(groupStatus, `✅ Importação concluída: ${successCount} grupo(s) adicionado(s), ${failCount} falha(s).`, 'success');
        bulkGroupIdsInput.value = ''; // Limpa a área de texto após a importação
        loadAndRenderGroups(); // Recarrega a lista para mostrar os novos grupos
    } else {
        showStatus(groupStatus, `❌ Nenhum grupo foi adicionado. ${failCount} falha(s).`, 'error');
    }
}


async function loadAndRenderGroups() {
    const groupStatus = document.getElementById('groupStatus');
    try {
        const response = await window.api.getGroups();
        if (response.success) {
            const groups = response.data;
            renderGroups(groups);
            populateCategoryFilter(groups);
        } else {
            showStatus(groupStatus, `❌ Erro ao carregar grupos: ${response.error}`, 'error');
            renderGroups([]);
            populateCategoryFilter([]);
        }
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        showStatus(groupStatus, `❌ Erro inesperado ao carregar grupos: ${error.message}`, 'error');
        renderGroups([]);
        populateCategoryFilter([]);
    }
}

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessageHandler);
    document.getElementById('clearMessageBtn').addEventListener('click', () => {
        document.getElementById('messageInput').value = '';
    });
    document.getElementById('addGroupBtn').addEventListener('click', addGroupHandler);
    document.getElementById('bulkAddGroupsBtn').addEventListener('click', bulkAddGroupsHandler); // Novo event listener

    loadAndRenderGroups();
});
