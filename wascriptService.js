// wascriptService.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de log
const logFilePath = path.join(__dirname, 'wascript-send-log.txt');

/**
 * Função auxiliar para escrever logs no arquivo e no console.
 * @param {string} message A mensagem a ser logada.
 */
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim()); // Também loga no console
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('❌ Erro ao escrever no arquivo de log:', err);
        }
    });
}

/**
 * Envia uma mensagem para múltiplos grupos do WhatsApp usando a API do WaScript.
 * @param {string} messageText O texto da mensagem a ser enviada.
 * @param {Array<string>} groupIds Uma lista de IDs de grupos do WhatsApp.
 * @param {string} token O token de autenticação da API do WaScript.
 * @param {number} intervalInSeconds O intervalo em segundos entre cada envio de mensagem.
 * @returns {Promise<Array<Object>>} Uma promessa que resolve com os resultados de cada envio.
 */
async function sendQuickMessage(messageText, groupIds, token, intervalInSeconds) {
    const results = [];
    // NOVA URL DA API, conforme o código que funciona
    const baseApiUrl = 'https://api-whatsapp.wascript.com.br/api/enviar-texto';

    // Converte o intervalo de segundos para milissegundos
    const intervalInMillis = intervalInSeconds * 1000;

    log(`⚙️ Iniciando envio para ${groupIds.length} grupos com intervalo de ${intervalInSeconds} segundos.`);

    for (let i = 0; i < groupIds.length; i++) {
        const groupId = groupIds[i];
        log(`➡️ Tentando enviar para o grupo: ${groupId} (Grupo ${i + 1} de ${groupIds.length})`);

        try {
            // Constrói a URL completa com o token
            const urlWithToken = `${baseApiUrl}/${token}`;

            // Corpo da requisição, usando "phone" e "message"
            const requestBody = {
                "phone": groupId, // O ID do grupo agora é "phone"
                "message": messageText
            };

            const response = await axios.post(urlWithToken, requestBody, {
                headers: {
                    'Content-Type': 'application/json' // O cabeçalho Authorization não é mais necessário
                }
            });

            // A verificação de sucesso também pode ter mudado, vamos verificar a estrutura da resposta
            // Assumindo que 'success: true' ainda é um indicador, ou que a ausência de erro já é sucesso.
            if (response.data && response.data.success === true) { // Ajustado para a propriedade 'success'
                log(`✅ Sucesso ao enviar para o grupo ${groupId}.`);
                results.push({ groupId, status: 'success', response: response.data });
            } else {
                // Se a API retornar um status 200 mas com 'success: false' ou outra indicação de falha
                log(`⚠️ Falha reportada pela API para o grupo ${groupId}: ${response.data ? JSON.stringify(response.data) : 'Resposta inesperada'}`);
                results.push({ groupId, status: 'failed', error: response.data || 'Resposta inesperada' });
            }
        } catch (error) {
            const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
            log(`❌ Erro ao enviar para o grupo ${groupId}: ${errorMessage}`);
            results.push({ groupId, status: 'error', error: errorMessage });
        }

        // Se não for o último grupo, espera o intervalo definido
        if (i < groupIds.length - 1) {
            log(`⏳ Aguardando ${intervalInSeconds} segundos antes de enviar para o próximo grupo...`);
            await new Promise(resolve => setTimeout(resolve, intervalInMillis));
        }
    }

    log('🏁 Todos os envios foram processados.');
    return results;
}

module.exports = {
    sendQuickMessage
};
