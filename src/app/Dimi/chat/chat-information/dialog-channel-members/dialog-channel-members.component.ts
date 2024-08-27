import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Inject, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MemberComponent } from './member/member.component';
import { UserService } from '../../../../shared/services/user.service';
import { DABubbleUser } from '../../../../shared/interfaces/user';
import { ChannelService } from '../../../../shared/services/channel.service';
import { DialogAddChannelMembersComponent } from '../dialog-add-channel-members/dialog-add-channel-members.component';
import { GlobalsubService } from '../../../../shared/services/globalsub.service';
import { DatabaseService } from '../../../../shared/services/database.service';

@Component({
  selector: 'app-dialog-channel-members',
  standalone: true,
  imports: [CommonModule, MatCardModule, MemberComponent],
  templateUrl: './dialog-channel-members.component.html',
  styleUrl: './dialog-channel-members.component.scss',
})
export class DialogChannelMembersComponent implements OnInit {
  closeImg = './img/close-default.png';
  addMemberImg = './img/add-members-default.png';
  activeUser!: DABubbleUser;
  channelMembers: DABubbleUser[] = [];
  readonly dialog = inject(MatDialog);
  @ViewChild('relativeElement', { static: true }) relativeElement!: ElementRef;


  constructor(
    private userService: UserService,
    public channelService: ChannelService,
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<DialogChannelMembersComponent>,
    private subService: GlobalsubService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

  }

  async ngOnInit() {
    this.activeUser = this.userService.activeUser;
    JSON.parse(sessionStorage.getItem('selectedChannel')!).assignedUser.forEach((userID: string) => {
      this.databaseService.readDataByField('users', 'id', userID).then((user) => {
        user.forEach((x: DABubbleUser) => {
          if (x && x.id !== this.activeUser.id) {
            this.channelMembers.push(x);
          }
        }
        );
      });
    }
    );

    await this.addChannelMembers();
  }


  async addChannelMembers() {
    this.subService.getActiveChannelObservable().subscribe((channel) => {
      if (channel) {
        this.channelMembers = [];
        channel.assignedUser.forEach((userID) => {
            this.userService.getOneUserbyId(userID).then((user) => {
              let x = user as DABubbleUser;
              if (x && x.id !== this.activeUser.id) {
                this.channelMembers.push(x);
              }
            });
          }
        );
      }
    });
  }




  addMembers() {
    this.closeDialog();

    const rect = this.relativeElement.nativeElement.getBoundingClientRect();
    const dialogAdd = this.dialog.open(DialogAddChannelMembersComponent, {
      position: {
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX - 135}px`,
      },
    });
  }

  changeAddMembersImg(hover: boolean) {
    if (hover) {
      this.addMemberImg = './img/add-members-hover.png';
    } else {
      this.addMemberImg = './img/add-members-default.png';
    }
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

  /* dialogAddChannelMembersIsOpen: boolean = false;
  openDialogAddChannelMembers(event: MouseEvent) {
    this.dialogAddChannelMembersIsOpen = !this.dialogAddChannelMembersIsOpen;
    const dialogConfig = this.handleDialogConfig(event, 'addChannelMembers');
    const dialogRef = this.dialog.open(
      DialogAddChannelMembersComponent,
      dialogConfig
    );
    this.handleDialogClose(dialogRef);
  } */
}
