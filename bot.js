const TELEGRAM_BOT_TOKEN = '7402148369:AAGCAP0VbA9keqjpOzu3whYL98nDVf3OeFM';
const SKALE_RPC_URL = 'https://testnet.skalenodes.com/v1/giant-half-dual-testnet';
const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require('ethers');  // Ensure correct import

// Initialize Telegram bot and Ethereum provider
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const provider = new ethers.JsonRpcProvider(SKALE_RPC_URL);
const PRIVATE_KEY = 'ed2efcd7cf551cc2d8d643a1bdc87c13b2494ff10a13f3cf5a8ec49c0ecc4865';
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Respond to the /balance command
bot.onText(/\/balance (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];

    if (!ethers.utils.isAddress(address)) {
        bot.sendMessage(chatId, 'Invalid Ethereum address.');
        return;
    }

    try {
        const balance = await provider.getBalance(address);
        const balanceInEth = ethers.formatEther(balance);
        bot.sendMessage(chatId, `Balance for address ${address}: ${balanceInEth} ETH`);
    } catch (error) {
        bot.sendMessage(chatId, 'Error fetching balance.');
        console.error('Error fetching balance:', error);
    }
});

// Respond to the /tx command
bot.onText(/\/tx (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const txHash = match[1];

    try {
        const tx = await provider.getTransaction(txHash);
        if (tx) {
            bot.sendMessage(chatId, `Transaction Details:\n\n${JSON.stringify(tx, null, 2)}`);
        } else {
            bot.sendMessage(chatId, 'Transaction not found.');
        }
    } catch (error) {
        bot.sendMessage(chatId, 'Error fetching transaction.');
        console.error('Error fetching transaction:', error);
    }
});

// Respond to the /send command
bot.onText(/\/send (.+) (.+) ?(.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const toAddress = match[1];
    const amount = match[2]; // in ETH
    const gasLimit = match[3] ? ethers.parseUnits(match[3], 'gwei') : undefined;

    if (!ethers.utils.isAddress(toAddress)) {
        bot.sendMessage(chatId, 'Invalid Ethereum address.');
        return;
    }

    try {
        const tx = {
            to: toAddress,
            value: ethers.parseEther(amount),
            gasLimit: gasLimit,
        };

        const txResponse = await wallet.sendTransaction(tx);
        bot.sendMessage(chatId, `Transaction sent. Hash: ${txResponse.hash}`);
        await txResponse.wait();
        bot.sendMessage(chatId, `Transaction confirmed in block: ${txResponse.blockNumber}`);
    } catch (error) {
        bot.sendMessage(chatId, 'Error sending transaction.');
        console.error('Error sending transaction:', error);
    }
});

// Respond to the /txstatus command
bot.onText(/\/txstatus (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const txHash = match[1];

    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
            const status = receipt.status === 1 ? 'Success' : 'Failed';
            bot.sendMessage(chatId, `Transaction Status: ${status}\nBlock Number: ${receipt.blockNumber}`);
        } else {
            bot.sendMessage(chatId, 'Transaction receipt not found.');
        }
    } catch (error) {
        bot.sendMessage(chatId, 'Error fetching transaction status.');
        console.error('Error fetching transaction status:', error);
    }
});

// Respond to the /block command
bot.onText(/\/block (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const blockNumber = match[1];

    try {
        const block = await provider.getBlock(blockNumber);
        if (block) {
            bot.sendMessage(chatId, `Block Details:\n\n${JSON.stringify(block, null, 2)}`);
        } else {
            bot.sendMessage(chatId, 'Block not found.');
        }
    } catch (error) {
        bot.sendMessage(chatId, 'Error fetching block information.');
        console.error('Error fetching block information:', error);
    }
});

// Respond to the /help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `Welcome to the Skale Blockchain Bot!\n\n` +
                        `Commands:\n` +
                        `/balance <address> - Get the balance of an Ethereum address.\n` +
                        `/tx <txHash> - Get details of a transaction.\n` +
                        `/send <toAddress> <amount> [gasLimit] - Send ETH to another address.\n` +
                        `/txstatus <txHash> - Check the status of a transaction.\n` +
                        `/block <blockNumber> - Get information about a specific block.`;
    bot.sendMessage(chatId, helpMessage);
});

// Handle errors
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log("Bot is Running..");
