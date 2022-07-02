import { Pipe, PipeTransform } from '@angular/core';

import emojis from "src/assets/emoji_map.json";

@Pipe({
  name: 'emojiFixup'
})
export class EmojiFixupPipe implements PipeTransform {
  public static emojis = (() => {
    const map = new Map<string,string>();
    for ( let [key, value ] of [...Object.entries(emojis)]) {
      map.set(key.toLowerCase(), value);
    }
    return map;
  })();

  public static regex = /\:[a-zA-Z0-9\-\_]+\:/gim;
  transform( value: string ): string {

    return this.substitute(value);
  }

  substitute( input: string ) {
    let text = input;
    const matches = input.match(EmojiFixupPipe.regex) ?? [];
    
    for ( let i = 0, L = matches.length; i < L; ++i ) {
      const el = matches[i];
      text = text.replace(el, EmojiFixupPipe.emojis.get(el) ?? el )
    }
    return text;
  }

}
