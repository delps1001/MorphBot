import { GuessContextHandler } from './guess-context-handler';
import * as StringSimilarity from 'string-similarity';

export class GuessHandler {
  private static readonly validSetGuess = '^!setGuess ([a-z\\|]+ ?)+$';

  static handleGuess(guess: string): string {
    if (!GuessContextHandler.correctAnswer) {
      return 'Nothing to guess!';
    }

    if (!this.validateGuess(guess)) {
      return `Invalid !guess command format, it must be of the form "${this.buildValidGuessRegex()}"`;
    }

    const guessSplit = guess.split(' ');
    const guesses = guessSplit.slice(1, guessSplit.length);
    console.info(`Guessing: ${guesses}`);
    let numCorrect = 0;
    const alreadyGuessed = [] as string[];
    for (const userGuess of guesses) {
      for (const correctAnswer of GuessContextHandler.correctAnswer) {
        if (alreadyGuessed.includes(correctAnswer)) {
          continue;
        }
        const possibleAnswers = correctAnswer.split('|');
        for (const possibleAnswer of possibleAnswers) {
          if (
            StringSimilarity.compareTwoStrings(possibleAnswer, userGuess) > 0.7
          ) {
            alreadyGuessed.push(correctAnswer);
            numCorrect += 1;
          }
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
    const splitMessage = messageContent.trim().split(' ');
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
    const regex = new RegExp(this.buildValidGuessRegex());
    return regex.test(messageContent);
  }

  private static validateSetGuess(messageContent: string): boolean {
    const regex = new RegExp(this.validSetGuess);
    return regex.test(messageContent);
  }

  private static buildValidGuessRegex(): string {
    const numberOfThingsToGuess = (GuessContextHandler.correctAnswer as string[])
      .length;
    let validGuess = `^!guess`;
    for (let x = 0; x < numberOfThingsToGuess; x = x + 1) {
      validGuess = `${validGuess} [a-z]+`;
    }
    validGuess = `${validGuess}$`;
    return validGuess;
  }
}
