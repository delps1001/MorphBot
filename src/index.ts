import * as Discord from 'discord.js';
import { config } from './config/config';
const client = new Discord.Client();
import * as Koa from 'koa';
import { MessageHandler } from './message-handlers/message-handler';

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}`);
});

client.on('message', async msg => {
  try {
    const admin = await client.fetchUser(config.admin);
    const isAdmin = msg.author.equals(admin);
    const response = MessageHandler.handleMessage(msg.content, isAdmin);
    if (response) {
      msg.reply(response);
    }
  } catch (error) {
    console.error(error);
    msg.reply('Error coming up with message response');
  }
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client
  .login(config.token)
  .then(strings => {
    console.info(strings);
  })
  .catch(error => {
    console.error(error);
  });

const app: Koa = new Koa();
const server = app.listen(process.env.PORT || 3995);

module.exports = server;
