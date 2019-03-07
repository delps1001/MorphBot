import * as Discord from 'discord.js';
import { config } from './config/config';
const client = new Discord.Client();

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client.login(config.token);
