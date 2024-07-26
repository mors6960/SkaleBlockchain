const TelegramBot = require('node-telegram-bot-api');
const Web3 = require('web3');

// Replace with your actual bot token from BotFather
const TELEGRAM_BOT_TOKEN = '7402148369:AAGCAP0VbA9keqjpOzu3whYL98nDVf3OeFM';

// Replace with your Skale RPC URL
const SKALE_RPC_URL = 'https://testnet.skalenodes.com/v1/giant-half-dual-testnet';

// Initialize the Telegram bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize Web3 with Skale RPC URL
const web3 = new Web3(new Web3.providers.HttpProvider(SKALE_RPC_URL));

// Respond to the /balance command
bot.onText(/\/balance (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    if (!web3.utils.isAddress(address)) {
        bot.sendMessage(chatId, 'Invalid Ethereum address.');
        return;
    }
    
    try {
        const balance = await web3.eth.getBalance(address);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');
        bot.sendMessage(chatId, `Balance for address ${address}: ${balanceInEth} ETH`);
    } catch (error) {
        bot.sendMessage(chatId, 'Error fetching balance.');
        console.error('Error fetching balance:', error);
    }
});

// Respond to the /help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `Welcome to the Skale Blockchain Bot!\n\n` +
                        `Use /balance <address> to get the balance of an Ethereum address on the Skale blockchain.\n` +
                        `Example: /balance 0x...`;
    bot.sendMessage(chatId, helpMessage);
});

// Handle errors
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});
