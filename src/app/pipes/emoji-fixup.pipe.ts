import { Pipe, PipeTransform } from '@angular/core';

import emojis from "../../assets/emoji_map.json";

@Pipe({
  name: 'emojiFixup'
})
export class EmojiFixupPipe implements PipeTransform {
  static emojis = (() => {
    const map = new Map<string, string>();
    for (const [key, value] of [...Object.entries(emojis)]) {
      map.set(key.toLowerCase(), value);
    }
    return map;
  })();

  static regex = /\:[a-zA-Z0-9\-\_]+\:/gim;
  transform(value: string): string {

    return this.substitute(value);
  }

  private substitute(input: string) {
    let text = input;
    const matches = input.match(EmojiFixupPipe.regex) ?? [];

    for (let i = 0, L = matches.length; i < L; ++i) {
      const el = matches[i];
      text = text.replace(el, EmojiFixupPipe.emojis.get(el) ?? el)
    }
    return text;
  }

}
