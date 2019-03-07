import * as Discord from 'discord.js';
import { config } from './config/config';
const client = new Discord.Client();
import * as Koa from 'koa';

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}`);
});

client.on('message', async msg => {
  const admin = await client.fetchUser(config.admin);
  if (msg.author.equals(admin)) {
    msg.reply('hello, I love you');
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
