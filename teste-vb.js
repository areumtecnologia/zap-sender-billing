const venom = require('venom-bot');
const filterChats = (chats, startDate, endDate, isUser) => {
    return chats.filter(chat => {
        const timestamp = new Date(chat.t * 1000);
        const isWithinDateRange = (!startDate || timestamp >= new Date(startDate)) && (!endDate || timestamp <= new Date(endDate));
        const isUserChat = isUser === undefined || chat.contact.isUser === isUser;
        return isWithinDateRange && isUserChat;
    });
};
console.log(new Date(1739225833 * 1000).toLocaleString())
// Inicializar o VenomBot
venom
    .create({
        session: 'cobrancas-bot', // Nome da sessão (pode ser qualquer nome)
        headless: 'new', // Executar em modo headless (sem interface gráfica)
    })
    .then((client) => {
        console.log('Cliente do WhatsApp está pronto!');
        client.onMessage(async (message) => {
            console.log(message)
            let chats = null;
            switch (message.body) {
                case 'unread':
                    chats = await client.getUnreadMessages();
                    for (const m of chats) {
                        console.log(m.from, m.body);
                    }
                    break;
                case 'getAllChats':
                    
                    chats = await client.getAllChats();
                    // Example usage:
                    const startDate = '2025-01-29'; // Specify start date or null
                    const endDate = null; //'2025-02-06'; // Specify end date or null
                    const isUser = true; // Specify true, false, or undefined

                    chats = filterChats(chats, startDate, endDate, isUser);
                    
                    for (const c of chats) {
                        
                        c.msgs = (await client.getAllMessagesInChat(c.id._serialized, true)).slice(-10);
                        
                        let name = c.contact.name || c.contact.pushname || c.id.user;
                        let msgsReceived = c.msgs.map(m => { return { body: m.body, stringdate: new Date(m.t * 1000).toLocaleString()}; });

                        // const today = new Date().setHours(0, 0, 0, 0);
                        // c.msgs = c.msgs.filter(m => {
                        //     const msgDate = new Date(m.timestamp * 1000).setHours(0, 0, 0, 0);
                        //     return msgDate === today;
                        // });

                        console.log(name, c.id._serialized, msgsReceived);
                    }
                    break;
                case 'getAllChatsNewMsg':
                    chats = await client.getAllChatsNewMsg();
                    break;

                case 'getAllChatsWithMessages':
                    chats = await client.getAllChatsWithMessages();
                    break;

                default:
                    //console.log(message.body, chats);
                    break;
            }
            //console.log(message.body, chats);

        });
    })
    .catch((error) => {
        console.error('Erro ao inicializar o VenomBot:', error);
    });