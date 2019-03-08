import { GuessContextHandler } from './guess-context-handler';

export class GuessHandler {
  private static validSetGuess = '^!setGuess [a-zA-z]+ [a-zA-z]+ [a-zA-z]+$';
  private static validGuess = '^!guess [a-zA-z]+ [a-zA-z]+ [a-zA-z]+$';

  static handleGuess(guess: string): string {
    if (!this.validateGuess(guess)) {
      return `Invalid !guess command format, it must be of the form "${
        this.validSetGuess
      }"`;
    }

    if (!GuessContextHandler.correctAnswer) {
      return 'Nothing to guess!';
    }

    const guessSplit = guess.split(' ');
    const guesses = guessSplit.slice(1, guessSplit.length);
    console.info(guesses);
    let numCorrect = 0;
    for (const userGuess of guesses) {
      for (const correctAnswer of GuessContextHandler.correctAnswer) {
        if (
          correctAnswer.includes(userGuess) &&
          userGuess.length > correctAnswer.length * 0.5
        ) {
          numCorrect += 1;
        }
      }
    }
    console.info(GuessContextHandler.correctAnswer);
    console.info(GuessContextHandler.correctAnswer.length);
    if (numCorrect === GuessContextHandler.correctAnswer.length) {
      const response = `We have a winner, congratulations! The correct answer was: ${
        GuessContextHandler.correctAnswer
      }`;
      GuessContextHandler.correctAnswer = null;
      return response;
    }

    return `Number correct: ${numCorrect}`;
  }

  static handleAdminSetGuess(messageContent: string): string {
    if (!this.validateSetGuess(messageContent)) {
      return `Invalid !setGuess command format, it must be of the form "${
        this.validSetGuess
      }"`;
    }
    const splitMessage = messageContent.split(' ');
    const splitMessageLower = [];
    for (const guess of splitMessage) {
      splitMessageLower.push(guess.toLowerCase());
    }
    GuessContextHandler.correctAnswer = splitMessageLower.slice(
      1,
      splitMessage.length
    );

    return 'Successfully set guess!';
  }

  private static validateGuess(messageContent: string): boolean {
    const regex = new RegExp(this.validGuess);
    return regex.test(messageContent);
  }

  private static validateSetGuess(messageContent: string): boolean {
    const regex = new RegExp(this.validSetGuess);
    return regex.test(messageContent);
  }
}
