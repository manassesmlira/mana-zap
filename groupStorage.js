// groupStorage.js

const Store = require('electron-store');

const store = new Store({
    name: 'groups',
    defaults: {
        // A estrutura padrão agora inclui a categoria para cada grupo
        whatsappGroups: [] // Cada item será { id: '...', name: '...', category: '...' }
    }
});

/**
 * Retorna a lista completa de grupos de WhatsApp salvos.
 * @returns {Array<Object>} Uma lista de objetos de grupo, cada um com 'id', 'name' e 'category'.
 */
function getGroups() {
    return store.get('whatsappGroups');
}

/**
 * Adiciona um novo grupo à lista de grupos salvos, incluindo sua categoria.
 * @param {string} id O ID do grupo do WhatsApp.
 * @param {string} name O nome amigável para identificar o grupo.
 * @param {string} category A categoria à qual o grupo pertence (ex: 'Trabalho', 'Devocional').
 */
function addGroup(id, name, category) { // Adicionado 'category' como parâmetro
    const groups = store.get('whatsappGroups');

    // Verifica se o grupo com o mesmo ID já existe para evitar duplicatas
    const existingGroup = groups.find(group => group.id === id);
    if (existingGroup) {
        console.warn(`⚠️ Grupo com ID ${id} já existe. Não será adicionado novamente.`);
        return;
    }

    // Adiciona o novo grupo ao array com a categoria
    groups.push({ id, name, category }); // Agora salvamos a categoria
    store.set('whatsappGroups', groups);
    console.log(`✅ Grupo "${name}" (${id}) da categoria "${category}" adicionado ao armazenamento.`);
}

/**
 * Remove um grupo da lista de grupos salvos com base no seu ID.
 * @param {string} groupId O ID do grupo a ser removido.
 */
function deleteGroup(groupId) {
    let groups = store.get('whatsappGroups');

    const initialLength = groups.length;
    groups = groups.filter(group => group.id !== groupId);

    if (groups.length < initialLength) {
        store.set('whatsappGroups', groups);
        console.log(`✅ Grupo com ID ${groupId} removido do armazenamento.`);
    } else {
        console.warn(`⚠️ Grupo com ID ${groupId} não encontrado para remoção.`);
    }
}

// Exporta as funções atualizadas
module.exports = {
    getGroups,
    addGroup,
    deleteGroup
};
