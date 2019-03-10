import { GuessHandler } from './guess-handler';
import { GuessContextHandler } from './guess-context-handler';

export class MessageHandler {
  static handleMessage(
    messageContent: string,
    isAdmin: boolean
  ): string | void {
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
  }
}
