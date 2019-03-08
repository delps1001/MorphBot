export class GuessContextHandler {
  static get correctAnswer(): string[] | null {
    return this._correctAnswer;
  }

  static set correctAnswer(value: string[] | null) {
    this._correctAnswer = value;
  }

  private static _correctAnswer: string[] | null;
}
