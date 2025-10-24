// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    /**
     * Solicita ao processo principal para enviar uma mensagem para os grupos especificados,
     * com um intervalo configurável entre os envios.
     * @param {string} messageText O texto da mensagem a ser enviada.
     * @param {Array<string>} groupIds Uma lista de IDs de grupos para os quais a mensagem será enviada.
     * @param {number} intervalInSeconds O intervalo em segundos entre cada envio de mensagem.
     * @returns {Promise<Object>} Uma promessa que resolve com o status da operação.
     */
    sendMessage: (messageText, groupIds, intervalInSeconds) => { // Adicionado 'intervalInSeconds'
        // Agora passamos messageText, groupIds E intervalInSeconds para o manipulador no main.js
        return ipcRenderer.invoke('send-message', { messageText, groupIds, intervalInSeconds });
    },

    getGroups: () => {
        return ipcRenderer.invoke('get-groups');
    },

    addGroup: (id, name, category) => {
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
