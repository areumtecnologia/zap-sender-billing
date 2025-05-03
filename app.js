const fs = require('fs');
const csv = require('csv-parser');
const venom = require('venom-bot');

// Caminho do arquivo CSV
const csvFilePath = './data/pendencias.csv';
const csvSociosFilePath = './data/socios.csv';
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
async function main(client) {
    // Ler o arquivo CSV
    const clientsData = await readCSV(csvFilePath);
    const sociosData = await readCSV(csvSociosFilePath);

    // Mensagem padrão de cobrança
    const message = [
        '*Núcleo Príncipe Ram - Tesouraria*',
        '',
        '*Lembrete de vencimento*',
        '',
        '🌟 Ref: Maio 2025',
        '📅 Vencimento: *até o dia 10/05*',
        '🪙 Débitos:',
        '',
        '[listaDebitos]',
        '*Total:* [totalDebitos]',
        '',
        '_(Para mais detalhes, consulte a fatura que enviamos para seu e-mail)_',
        '',
        'Somos gratos se puder efetuar o pagamento antes do vencimento.',
        '',
        '⚠️ Caso o pagamento já tenha sido efetuado, pedimos que desconsidere essa mensagem.',
        '⚠️ Em caso de dúvidas, entre em contato com os tesoureiros: Edivan (+55 91 9832-4329) ou Antônio Kledson (+55 91 8993-5530)',
        '',
        'Seu compromisso pode ser pago usando a chave pix CNPJ ou código pix abaixo:👇🏻',        
    ].join('\n');
    const message2 = '07.598.829.0001-87';
    const message3 = [
        '_Essa é uma mensagem automatizada e não supervisionada, favor nao responder para este contato._',
        '',
        '> UnityChat & ProAtivo - API',
        'www.areum.com.br'
    ].join('\n');
    // Enviar mensagem para cada cliente

    for (const cd of clientsData) {
        const { Nome, Valor, GP } = cd;
        // Obtem informacoes do sócio
        const socio = sociosData.find(socio => socio.Nome === Nome);
        if (!socio) {
            console.log(`\x1b[31mSócio não encontrado para ${Nome}\x1b[0m`);
            continue; // Pular para o próximo cliente se o sócio não for encontrado
        }

        const { Celular } = socio;
        if (!Celular) {
            console.error(`\x1b[31mCelular não encontrado para ${Nome}\x1b[0m`);
            continue; // Pular para o próximo cliente se o celular não for encontrado
        }

        // Agrupar os débitos do grupo de associados
        const debitos = clientsData.filter(socio => socio.GP === Nome || (socio.Nome === Nome && !socio.GP));
        if (debitos.length === 0) {
            console.log(`\x1b[31mSócio ${Nome} faz parte de grupo de associado\x1b[0m`);
            continue; // Pular para o próximo cliente se não houver débitos
        }
        // Calcular o total de débitos
        const totalDebitos = debitos.reduce((acc, debito) => acc + parseFloat(debito.Valor.replace(',', '.')), 0);
        const debitosPorSocio = debitos.map(x => `${x.Nome.split(' ')[0]} ${x.Nome.split(' ')[x.Nome.split(' ').length-1]}: ${x.Valor}`).join('\n');
        // console.log(`Débitos:\n${debitosPorSocio}\nTotal: R$${totalDebitos.toFixed(2)}`);

        const cel = Celular.split('|')[0].replace(/\D/g, '');
        if (cel){
            // Formatar o número de telefone (adicionar o código do país e remover caracteres não numéricos)
            const phoneNumber = `${cel}@c.us`;

            // Substituir placeholders na mensagem
            const personalizedMessage = message
                .replace('[Nome]', Nome)
                .replace('[listaDebitos]', debitosPorSocio)
                .replace('[totalDebitos]', totalDebitos.toFixed(2));

            console.log(`Enviando mensagem para ${Nome} - ${phoneNumber}`, personalizedMessage);

            try {            
                const mensagens = [personalizedMessage, message2, message3];
                for (const msg of mensagens) {
                    // Enviar a mensagem
                    await client.sendText(phoneNumber, msg);
                    console.log(`Mensagem enviada para ${Nome} - ${cel}`);
                    await sleep(1000); // 1 segundos
                }

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
        main(client); // Iniciar o envio das mensagens
    })
    .catch((error) => {
        console.error('Erro ao inicializar o VenomBot:', error);
    });