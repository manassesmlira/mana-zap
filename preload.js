// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendMessage: (messageText, groupIds) => {
        return ipcRenderer.invoke('send-message', { messageText, groupIds });
    },

    getGroups: () => {
        return ipcRenderer.invoke('get-groups');
    },

    /**
     * Solicita ao processo principal para adicionar um novo grupo, incluindo a categoria.
     * @param {string} id O ID do grupo.
     * @param {string} name O nome amigável do grupo.
     * @param {string} category A categoria do grupo.
     * @returns {Promise<Object>} Uma promessa que resolve com o status da operação.
     */
    addGroup: (id, name, category) => { // Adicionado 'category' como parâmetro
        // Agora passamos o id, name E category para o manipulador no main.js
        return ipcRenderer.invoke('add-group', { id, name, category });
    },

    deleteGroup: (groupId) => {
        return ipcRenderer.invoke('delete-group', groupId);
    },

    on: (channel, listener) => {
        const validChannels = ['log-message', 'status-update'];
        if (validChannels.includes(channel)) {
            const wrappedListener = (event, ...args) => listener(...args);
            ipcRenderer.on(channel, wrappedListener);
            return () => ipcRenderer.removeListener(channel, wrappedListener);
        }
    }
});
