const fs = require('fs');
const csv = require('csv-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Caminho do arquivo CSV
const csvFilePath = './pendencias_test.csv';

// Função para ler o arquivo CSV
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Função para enviar a mensagem de cobrança
async function sendMessages(clients) {

    // Ler o arquivo CSV
    const clientsData = await readCSV(csvFilePath);

    // Mensagem padrão de cobrança
    const message = [
        '*TESOURARIA*',
        '',
        'Olá, [Nome]!',
        '',
        'Estamos enviando esta mensagem para lembrá-lo(a) do valor pendente de R$[Valor].',
        'O valor pode ser pago usando a chave pix CNPJ _07598820000187_.',
        'Somos gratos se puder efetuar o pagamento o mais breve possível.',
        'Agradecemos a compreensão e a colaboração!',
        '',
        'Renan Moreira - 1o Tesoureiro'
    ].join('\n');

    // Enviar mensagem para cada cliente
    for (const clientData of clientsData) {
        const { Nome, Celular, Valor } = clientData;

        // Formatar o número de telefone (adicionar o código do país e remover caracteres não numéricos)
        const phoneNumber = `${Celular.replace(/\D/g, '')}@c.us`;

        // Substituir placeholders na mensagem
        const personalizedMessage = message
            .replace('[Nome]', Nome)
            .replace('[Valor]', Valor);
        
        try {            
            // Enviar a mensagem
            await clients.sendMessage(phoneNumber, personalizedMessage);
            console.log(`Mensagem enviada para ${Nome} (${Celular})`);
        } catch (error) {
            console.error('Erro ao enviar mensagens:', error);
        }
    }

    console.log('Todas as mensagens foram enviadas com sucesso!');
    
}

// Configuração do cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(), // Salva a sessão localmente para não precisar escanear o QR Code toda vez
    puppeteer: {
        headless: true, // Executar em modo headless (sem interface gráfica)
    },
});

// Evento para exibir o QR Code no terminal
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Evento quando o cliente estiver pronto
client.on('ready', async () => {
    console.log('Cliente do WhatsApp está pronto!');
    await sendMessages(client);
});

// Evento para lidar com erros
client.on('auth_failure', (msg) => {
    console.error('Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
});

// Inicializar o cliente
client.initialize();