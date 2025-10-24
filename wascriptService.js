// wascriptService.js

// Importa o módulo axios para fazer requisições HTTP para a API do Wascript
const axios = require('axios');
// Importa o módulo fs para lidar com o sistema de arquivos (para o log)
const fs = require('fs');
// O módulo path é útil para construir caminhos de arquivo de forma segura
const path = require('path');

// Define o caminho para o arquivo de log.
// Usamos path.join para garantir que o caminho seja correto em diferentes sistemas operacionais.
const LOG_FILE_PATH = path.join(__dirname, 'wascript-send-log.txt');

/**
 * Função auxiliar para registrar mensagens em um arquivo de log e no console.
 * @param {string} type O tipo da mensagem (INFO, WARN, ERROR, SUCCESS).
 * @param {string} message O texto da mensagem a ser logada.
 */
async function logMessage(type, message) {
    try {
        const logEntry = `${new Date().toISOString()} - ${type}: ${message}\n`;
        // Adiciona a entrada ao arquivo de log de forma síncrona para garantir que seja escrita
        fs.appendFileSync(LOG_FILE_PATH, logEntry);
        // Também exibe no console do processo principal do Electron
        console.log(logEntry.trim());
    } catch (error) {
        // Se houver um erro ao salvar o log, apenas exibe no console
        console.error('❌ Erro ao salvar log:', error);
    }
}

/**
 * Envia uma mensagem de texto para uma lista de grupos do WhatsApp usando a API do Wascript.
 *
 * @param {string} messageText O texto da mensagem a ser enviada.
 * @param {Array<string>} groupIds Uma lista de IDs de grupos do WhatsApp para os quais a mensagem será enviada.
 * @param {string} wascriptToken O token de autenticação da API do Wascript.
 * @returns {Promise<Array<Object>>} Uma promessa que resolve com os resultados de cada envio.
 */
async function sendQuickMessage(messageText, groupIds, wascriptToken) {
    const results = []; // Array para armazenar os resultados de cada envio

    await logMessage('INFO', `Iniciando envio da mensagem: "${messageText.substring(0, 100)}..." para ${groupIds.length} grupo(s).`);

    // Itera sobre cada ID de grupo fornecido
    for (const groupId of groupIds) {
        try {
            const url = `https://api-whatsapp.wascript.com.br/api/enviar-texto/${wascriptToken}`;
            const body = {
                "phone": groupId, // O ID do grupo é o "telefone" para a API
                "message": messageText
            };

            // Faz a requisição POST para a API do Wascript
            const res = await axios.post(url, body, {
                headers: { "Content-Type": "application/json" }
            });

            // Verifica se a API retornou um erro (sucesso: false)
            if (res.data.success === false) {
                const errorMessage = `API retornou erro para ${groupId}: ${JSON.stringify(res.data)}`;
                await logMessage('ERROR', errorMessage);
                results.push({ groupId, success: false, error: errorMessage });
            } else {
                await logMessage('INFO', `Mensagem enviada com sucesso para ${groupId}`);
                results.push({ groupId, success: true, data: res.data });
            }

            // Pequena pausa entre os envios para evitar sobrecarregar a API ou ser bloqueado
            // Você pode ajustar este valor se necessário. 1 segundo (1000ms) é um bom ponto de partida.
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            // Captura erros de rede ou outros erros durante a requisição
            const errorMessage = `Erro ao enviar para ${groupId}: ${error.message}`;
            await logMessage('ERROR', errorMessage);
            results.push({ groupId, success: false, error: errorMessage });
        }
    }

    await logMessage('SUCCESS', 'Processo de envio para todos os grupos concluído.');
    return results; // Retorna os resultados detalhados de cada envio
}

// Exporta a função sendQuickMessage para que possa ser usada por outros módulos (como main.js)
module.exports = {
    sendQuickMessage
};
