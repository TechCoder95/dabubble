import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { ChannelService } from '../../../../shared/services/channel.service';
import { UserService } from '../../../../shared/services/user.service';
import { FormsModule } from '@angular/forms';
import { DABubbleUser } from '../../../../shared/interfaces/user';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dialog-add-channel-members',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatCardModule, FormsModule],
  templateUrl: './dialog-add-channel-members.component.html',
  styleUrls: ['./dialog-add-channel-members.component.scss'],
})
export class DialogAddChannelMembersComponent implements AfterViewInit {
  closeImg = './img/close-default.png';
  @ViewChild('inputName') inputName!: ElementRef;
  focusNameInput: boolean = false;
  searchQuery: string = '';
  searchResults: DABubbleUser[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogAddChannelMembersComponent>,
    public channelService: ChannelService,
    public userService: UserService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.inputName.nativeElement.blur(), 200);
  }

  changeCloseImg(hover: boolean) {
    if (hover) {
      this.closeImg = './img/close-hover.png';
    } else {
      this.closeImg = './img/close-default.png';
    }
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  async searchUser() {
    this.searchResults = await this.userService.searchUsersByName(this.searchQuery);
  }

  async addUserToChannel(user: DABubbleUser) {
    console.log("User geladen: ", user);
    const channel = await firstValueFrom(this.channelService.selectedChannel$);
    console.log('Channel geladen: ', channel);
    if (channel) {
      console.log("der channel", channel);
      
      if (!channel.assignedUser.includes(user.id!)) {
        channel.assignedUser.push(user.id!);
        await this.channelService.updateChannel(channel);
      }
    }
  }
}
