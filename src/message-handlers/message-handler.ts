import { GuessHandler } from './guess-handler';
import { GuessContextHandler } from './guess-context-handler';
import { PriceHandler } from './price-handler';

export class MessageHandler {
  static async handleMessage(
    messageContent: string,
    isAdmin: boolean
  ): Promise<string | void> {
    if (messageContent.startsWith('!guess')) {
      return GuessHandler.handleGuess(messageContent);
    }

    if (messageContent.startsWith('!setGuess') && isAdmin) {
      return GuessHandler.handleAdminSetGuess(messageContent);
    }

    if (messageContent.startsWith('!clearGuess') && isAdmin) {
      GuessContextHandler.correctAnswer = null;
    }

    if (messageContent.startsWith("!isTodd'sIronmanBanned")) {
      return 'Yes.';
    }

    if (messageContent.startsWith('!price')) {
      return PriceHandler.handlePrice(messageContent);
    }
  }
}
