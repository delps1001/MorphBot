import { GuessHandler } from './guess-handler';

export class MessageHandler {
  static handleMessage(messageContent: string): void {
    if (messageContent.includes('!guess')) {
      GuessHandler.handleGuess(messageContent);
    }
  }
}
