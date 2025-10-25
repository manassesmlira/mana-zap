// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // Adicionado 'dialog' aqui
const path = require('path');
require('dotenv').config();

const { sendQuickMessage } = require('./wascriptService');
const { getGroups, addGroup, deleteGroup } = require('./groupStorage');

const WASCRIPT_TOKEN = process.env.WASCRIPT_TOKEN;

if (!WASCRIPT_TOKEN) {
    console.error('❌ ERRO: WASCRIPT_TOKEN não encontrado no arquivo .env. Por favor, configure-o corretamente.');
    // Usar dialog.showErrorBox aqui também é uma boa prática para o usuário final
    dialog.showErrorBox('Erro de Configuração', 'WASCRIPT_TOKEN não encontrado no arquivo .env. Por favor, configure-o corretamente.');
    app.quit();
}

let mainWindow;

// --- Manipulador de Erros Global para o Processo Principal ---
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception no processo principal:', error);
    // Exibe uma caixa de diálogo de erro para o usuário
    dialog.showErrorBox('Erro no Aplicativo', `Ocorreu um erro inesperado: ${error.message}\n\nVerifique o console (se aberto) ou os logs para mais detalhes.`);
    app.quit(); // Garante que o aplicativo feche após um erro crítico
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // --- DESCOMENTE ESTA LINHA PARA DEPURAR O APLICATIVO EMPACOTADO ---
    //mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- Manipuladores de Comunicação Inter-Processos (IPC Main) ---

ipcMain.handle('get-groups', async () => {
    try {
        const groups = getGroups();
        console.log('✅ Grupos carregados com sucesso:', groups);
        return { success: true, data: groups };
    } catch (error) {
        console.error('❌ Erro ao obter grupos:', error.message);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('add-group', async (event, { id, name, category }) => {
    try {
        if (!id || !name || !category) {
            throw new Error('ID, Nome e Categoria do grupo são obrigatórios.');
        }
        addGroup(id, name, category);
        console.log(`✅ Grupo adicionado: ${name} (${id}) na categoria ${category}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao adicionar grupo:', error.message);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-group', async (event, groupId) => {
    try {
        if (!groupId) {
            throw new Error('ID do grupo é obrigatório para exclusão.');
        }
        deleteGroup(groupId);
        console.log(`✅ Grupo removido: ${groupId}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao deletar grupo:', error.message);
        return { success: false, error: error.message };
    }
});

/**
 * Manipulador para enviar mensagem, agora recebendo o intervalo entre envios.
 */
ipcMain.handle('send-message', async (event, { messageText, groupIds, intervalInSeconds }) => {
    try {
        if (!WASCRIPT_TOKEN) {
            throw new Error('WASCRIPT_TOKEN não configurado. Verifique seu arquivo .env.');
        }
        if (!messageText || messageText.trim() === '') {
            throw new Error('A mensagem não pode estar vazia. Por favor, digite algo.');
        }
        if (!groupIds || groupIds.length === 0) {
            throw new Error('Nenhum grupo selecionado para envio. Adicione grupos primeiro.');
        }
        if (isNaN(intervalInSeconds) || intervalInSeconds < 13) {
            throw new Error('O intervalo de envio deve ser um número e no mínimo 13 segundos.');
        }

        console.log(`🚀 Iniciando envio da mensagem: "${messageText.substring(0, 50)}..." para ${groupIds.length} grupo(s) com intervalo de ${intervalInSeconds}s.`);
        const results = await sendQuickMessage(messageText, groupIds, WASCRIPT_TOKEN, intervalInSeconds);
        console.log('✅ Envio concluído. Resultados:', results);
        return { success: true, data: results };
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error.message);
        return { success: false, error: error.message };
    }
});
