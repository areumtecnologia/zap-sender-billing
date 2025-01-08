const fs = require('fs');
const csv = require('csv-parser');
const venom = require('venom-bot');

// Caminho do arquivo CSV
const csvFilePath = './pendencias.csv';

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

// Função para aguardar um tempo específico (em milissegundos)
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Função para enviar a mensagem de cobrança
async function sendMessages(client) {
    // Ler o arquivo CSV
    const clientsData = await readCSV(csvFilePath);

    // Mensagem padrão de cobrança
    const message = [
        '*TESOURARIA*',
        '',
        'Olá, [Nome]!',
        '',
        'Estamos enviando esta mensagem para lembrar do valor pendente de `R$[Valor]`.',
        '_(Para mais detalhes, consulte a fatura que enviamos para seu e-mail cadastrado no REUNI ou um dos tesoureiros)_',
        '',
        'Somos gratos se puder efetuar o pagamento o mais breve possível.',
        'Agradecemos a compreensão e a colaboração!',
        '',
        'Caso o pagamento já tenha sido efetuado, pedimos que desconsidere essa mensagem.',
        '',
        '',
        'Renan Moreira - 1o Tesoureiro',
        '',
        '_Essa é uma mensagem automatizada e não supervisionada, favor nao responder._',
        '',
        '> UnityChat & ProAtivo - API',
        'www.areum.com.br'
    ].join('\n');
    // Enviar mensagem para cada cliente
    for (const clientData of clientsData) {
        const { Nome, Celular, Valor } = clientData;

        const cel = Celular.replace(/\D/g, '');
        if (cel){
            // Formatar o número de telefone (adicionar o código do país e remover caracteres não numéricos)
            const phoneNumber = `${cel}@c.us`;

            // Substituir placeholders na mensagem
            const personalizedMessage = message
                .replace('[Nome]', Nome)
                .replace('[Valor]', Valor);

            try {            
                // Enviar a mensagem
                await client.sendText(phoneNumber, personalizedMessage);
                console.log(`Mensagem enviada para ${Nome} - ${Celular}`);
            } catch (error) {
                console.error(`Erro ao enviar mensagem para ${Nome} - ${Celular}`, error);
            }
            
            // Aguardar 5 segundos antes de enviar a próxima mensagem
            await sleep(5000); // 5000 milissegundos = 5 segundos
        }
        
    }

    console.log('Todas as mensagens foram enviadas com sucesso!');
}

// Inicializar o VenomBot
venom
    .create({
        session: 'cobrancas-bot', // Nome da sessão (pode ser qualquer nome)
        headless: 'new', // Executar em modo headless (sem interface gráfica)
    })
    .then((client) => {
        console.log('Cliente do WhatsApp está pronto!');
        sendMessages(client); // Iniciar o envio das mensagens
    })
    .catch((error) => {
        console.error('Erro ao inicializar o VenomBot:', error);
    });