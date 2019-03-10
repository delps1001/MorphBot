import * as requestPromise from 'request-promise-native';
import { config } from '../config/config';
import * as NodeCache from 'node-cache';

export class PriceHandler {
  private static correctFormat = '^!price .+$';
  private static nodeCache = new NodeCache();
  private static summaryCacheKey = 'summary';

  static async handlePrice(messageContent: string): Promise<string> {
    if (!this.validateMessagePriceSyntax(messageContent)) {
      return `Invalid !price command format, it must be of the form "${
        this.correctFormat
      }"`;
    }
    const itemName = this.extractItemName(messageContent);
    let osbResponse = this.nodeCache.get(
      this.summaryCacheKey
    ) as OsBuddyResponse;
    try {
      if (!osbResponse) {
        console.info('No cached osb prices, calling osb');
        osbResponse = await this.callOsbItemSummaryApi();
      } else {
        console.info('Using cached osb prices.');
      }
      for (const item in osbResponse) {
        if (
          osbResponse[item]['name'].toLocaleLowerCase() ===
          itemName.toLowerCase()
        ) {
          console.info(osbResponse[item]['overall_average']);
          return `\n***${itemName.toUpperCase()}:***\n**Overall Average:** ${osbResponse[
            item
          ].overall_average.toLocaleString('en-us', {
            useGrouping: true,
          })}\n**Buy Price:** ${osbResponse[item].buy_average.toLocaleString(
            'en-us',
            { useGrouping: true }
          )}\n**Sell Price:** ${osbResponse[item].sell_average.toLocaleString(
            'en-us',
            { useGrouping: true }
          )}`;
        }
      }
    } catch (error) {
      console.error(error);
      return `Error retrieving item price for ${itemName}`;
    }
    return `Could not find item named: ${itemName}`;
  }

  private static extractItemName(message: string) {
    const splitMessage = message.split(' ');
    const splitMessageIgnoringCommand = splitMessage.slice(
      1,
      splitMessage.length
    );
    let itemName = '';
    for (const itemPhrase of splitMessageIgnoringCommand) {
      itemName = itemName + itemPhrase + ' ';
    }
    return itemName.trim();
  }
  private static validateMessagePriceSyntax(message: string): boolean {
    const regex = new RegExp(this.correctFormat);
    return regex.test(message);
  }

  private static async callOsbItemSummaryApi(): Promise<OsBuddyResponse> {
    const options = {
      uri: config.osbuddySummaryUrl,
      json: true,
      method: 'GET',
      cache: true,
    };
    const response = (await requestPromise(options)) as OsBuddyResponse;
    this.nodeCache.set(this.summaryCacheKey, response, 60 * 60 * 2);
    return response;
  }
}

interface OsBuddyResponse {
  [itemId: string]: Item;
}

interface Item {
  name: string;
  overall_average: number;
  members: boolean;
  buy_quantity: number;
  sell_quantity: number;
  overall_quantity: number;
  buy_average: number;
  sell_average: number;
}
