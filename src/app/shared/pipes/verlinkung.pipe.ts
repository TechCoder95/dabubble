import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'verlinkung',
  standalone: true
})
export class VerlinkungPipe implements PipeTransform {

  transform(value: string): string {
    const userRegex = /(@\w+)/g;
    const channelRegex = /(#\w+)/g;

    return value.replace(userRegex, '<span class="user-verlinkung">$1</span>')
                .replace(channelRegex, '<span class="channel-verlinkung">$1</span>');
  }


}
