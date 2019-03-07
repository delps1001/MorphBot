import * as Discord from 'discord.js';
const client = new Discord.Client();

client.on('ready', () => {
    console.info(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
    if (msg.content === 'ping' ) {
        msg.reply('pong');
    }
});

client.login('NTUzMTg2ODMyNjYyMjY1ODc2.D2KoMw.4RZRo9YaeMv8R2bHO5JKPYw22Co');
