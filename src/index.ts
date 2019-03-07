import * as Discord from 'discord.js';
import { config } from './config/config';
const client = new Discord.Client();
import * as Koa from 'koa';

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client.login(config.token).then(string => {
    console.info(string);
}).catch( error => {
    console.error(error);
});


const app: Koa = new Koa();
const server = app.listen(process.env.PORT || 3995);

module.exports = server;
