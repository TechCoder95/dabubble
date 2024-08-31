import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ChannelService } from '../../../shared/services/channel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { DABubbleUser } from '../../../shared/interfaces/user';
import { ChatMessage } from '../../../shared/interfaces/chatmessage';
import { DatabaseService } from '../../../shared/services/database.service';
import { TextChannel } from '../../../shared/interfaces/textchannel';
import { MessageType } from '../../../shared/enums/messagetype';
import { Router, RouterModule } from '@angular/router';
import { EmojisPipe } from '../../../shared/pipes/emojis.pipe';
import { DAStorageService } from '../../../shared/services/dastorage.service';
import { AddFilesComponent } from './add-files/add-files.component';
import { EmojiesComponent } from './emojies/emojies.component';
import { LinkChannelMemberComponent } from './link-channel-member/link-channel-member.component';
import { HtmlConverterPipe } from '../../../shared/pipes/html-converter.pipe';
import { SafeResourceUrl } from '@angular/platform-browser';
import { VerlinkungPipe } from '../../../shared/pipes/verlinkung.pipe';
import { EmojiInputPipe } from '../../../shared/pipes/emoji-input.pipe';

@Component({
  selector: 'app-chat-inputfield',
  standalone: true,
  imports: [
    CommonModule,
    CommonModule,
    FormsModule,
    RouterModule,
    EmojisPipe,
    EmojiesComponent,
    AddFilesComponent,
    LinkChannelMemberComponent,
    HtmlConverterPipe,
    VerlinkungPipe,
    EmojiInputPipe,
  ],
  providers: [EmojisPipe],
  templateUrl: './inputfield.component.html',
  styleUrl: './inputfield.component.scss',
})
export class InputfieldComponent implements OnInit, AfterViewInit {
  addFilesImg = './img/add-files-default.svg';
  addEmojiImg = './img/add-emoji-default.svg';
  addLinkImg = './img/add-link-default.svg';

  selectedThread: boolean = false;
  selectedChannel: TextChannel | null = null;

  activeUser!: DABubbleUser;
  usersInChannel: DABubbleUser[] = [];
  linkedUsers: DABubbleUser[] = [];
  threadOwner!: DABubbleUser;
  selectedMessage!: ChatMessage;

  textareaValue: string = '';

  @Input() messageType: MessageType = MessageType.Directs;
  @Input() selectedChannelFromChat: any;
  @Input() activeUserFromChat: any;
  @Input() isSelectingUser: boolean | undefined;
  @Input() isSelectingChannel: boolean | undefined;
  fileInput: any;

  @Input() selectedThreadOwner: any;

  @ViewChild('chatTextarea') chatTextarea!: ElementRef;

  storage: any;

  constructor(
    public channelService: ChannelService,
    private userService: UserService,
    private databaseService: DatabaseService,
    private router: Router,
    private storageService: DAStorageService,
  ) {
    this.activeUser = this.userService.activeUser;
    this.selectedChannel = JSON.parse(
      sessionStorage.getItem('selectedChannel')!,
    );
  }

  ngAfterViewInit(): void {
    this.chatTextarea.nativeElement.focus();
  }

  ngOnInit(): void {
    // this.getPlaceholderText();
    if (this.activeUserFromChat) {
      this.activeUserFromChat.subscribe((user: DABubbleUser) => {
        this.activeUser = user;
      });
    }

    if (this.selectedChannelFromChat) {
      this.selectedChannelFromChat.subscribe((channel: TextChannel) => {
        this.selectedChannel = channel;
      });
    }

    if (this.selectedThreadOwner) {
      this.selectedThreadOwner.subscribe((threadOwner: any) => {
        this.threadOwner = threadOwner;
      });
    }
    this.getUsersInChannel();
  }

  async getUsersInChannel() {
    this.selectedChannel?.assignedUser.forEach((id) => {
      this.userService.getOneUserbyId(id).then((user: DABubbleUser) => {
        if (user !== null && user !== undefined) {
          this.usersInChannel.push(user);
        }
      });
    });
  }

  changeAddFilesImg(hover: boolean) {
    if (hover) {
      this.addFilesImg = './img/add-files-hover.svg';
      this.addEmojiImg = './img/add-emoji.svg';
      this.addLinkImg = './img/add-link.svg';
    } else {
      this.setDefaultImages();
    }
  }

  changeAddEmojiImg(hover: boolean) {
    if (hover) {
      this.addEmojiImg = './img/add-emoji-hover.svg';
      this.addFilesImg = './img/add-files.svg';
      this.addLinkImg = './img/add-link.svg';
    } else {
      this.setDefaultImages();
    }
  }

  changeAddLinkImg(hover: boolean) {
    if (hover) {
      this.addLinkImg = './img/add-link-hover.svg';
      this.addEmojiImg = './img/add-emoji.svg';
      this.addFilesImg = './img/add-files.svg';
    } else {
      this.setDefaultImages();
    }
  }

  setDefaultImages() {
    this.addFilesImg = './img/add-files-default.svg';
    this.addEmojiImg = './img/add-emoji-default.svg';
    this.addLinkImg = './img/add-link-default.svg';
  }

  async sendMessage(type: MessageType) {
    switch (type) {
      case MessageType.Groups:
      case MessageType.Directs:
        this.selectedChannel = JSON.parse(
          sessionStorage.getItem('selectedChannel')!,
        );
        await this.send();
        break;
      case MessageType.Threads:
        this.selectedChannel = JSON.parse(sessionStorage.getItem('selectedThread')!,);
        await this.send();
        break;
      case MessageType.NewDirect:
        if (this.isSelectingChannel) {
          await this.sendMessageToChannel();
        } else if (this.isSelectingUser) {
          await this.sendMessageToUser();
        }
        break;
      default:
        break;
    }
  }

  async sendMessageToChannel() {
    const selectedChannel = this.channelService.getSelectedChannel();
    if (selectedChannel) {
      this.selectedChannel = selectedChannel;
      await this.router.navigate(['/home/channel/' + selectedChannel.id]);
      await this.send();
    }
  }

  async sendMessageToUser() {
    const channel = await this.channelService.findOrCreateChannelByUserID();
    if (channel) {
      this.selectedChannel = channel;
      this.channelService.selectChannel(channel);
      await this.router.navigate(['/home/channel/' + channel.id]);
      await this.send();
    }
  }

  image!: string | ArrayBuffer;
  pdf: SafeResourceUrl | null = null;

  async send() {
    let message: ChatMessage = this.returnCurrentMessage();

    if (message.message !== '' || this.image) {
      try {
        if (this.image || this.pdf) {
          message.fileUrl = await this.saveFileInStorage(message);
          message.fileName = this.fileName;
        }

        this.databaseService.addChannelDataToDB('messages', message);

        if (this.messageType === MessageType.Threads) {
          this.selectedMessage = JSON.parse(sessionStorage.getItem('threadMessage')!);
          this.selectedMessage.replyNumber = this.selectedMessage.replyNumber + 1;
          this.selectedMessage.lastRepliedTime = message.timestamp;          
          this.databaseService.updateDataInDB('messages', this.selectedMessage.id!, this.selectedMessage);
          sessionStorage.setItem('threadMessage', JSON.stringify(this.selectedMessage));
        }
        this.textareaValue = '';
        this.selectedFile = '';
        this.image = '';
        this.getPlaceholderText();
        this.linkedUsers = [];
      } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
      }
    } 
  }

  returnCurrentMessage() {
    return {
      channelId: this.selectedChannel!.id,
      channelName: this.selectedChannel!.name || this.activeUser.username,
      message: this.textareaValue,
      timestamp: new Date().getTime(),
      senderName: this.activeUser.username || 'guest',
      senderId: this.activeUser.id || 'senderIdDefault',
      edited: false,
      deleted: false,
      imageUrl: '',
      isThreadMsg: this.messageType === MessageType.Threads,
      fileUrl: '',
      replyNumber: 0,
      lastRepliedTime: new Date().getTime(),
    };
  }

  async saveFileInStorage(message: ChatMessage): Promise<string> {
    // Bild/PDF in Firestore Storage hochladen
    let fileBlob: Blob;
    if (typeof this.image === 'string') {
      const byteString = atob(this.image.split(',')[1]);
      const mimeString = this.image.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      fileBlob = new Blob([ab], { type: mimeString });
    } else {
      fileBlob = new Blob([this.image]);
    }
    let imageUrl: any = await this.storageService.uploadMessageImage(
      message.channelId,
      fileBlob,
      this.fileName,
    );
    return imageUrl;
  }

  handleEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage(this.messageType);
    }
  }

  handleFocus() {
    const setRef = document.getElementById('textarea');
    if (setRef) setRef.innerHTML = '';
  }

  handleBlur() {
    this.getPlaceholderText();
  }

  handleEmoji(event: any) {
    document.getElementById('textarea')!.innerHTML += event.data;
  }

  getPlaceholderText(): string {
    if (this.image) {
      return 'Bildunterschrift hinzufügen';
    }

    if (this.pdf) {
      return 'PDF kommentieren';
    }

    if (this.messageType === MessageType.NewDirect) {
      const selectedUser = this.userService.getSelectedUser();
      return selectedUser
        ? `Nachricht an @${selectedUser.username}`
        : 'Starte eine neue Nachricht';
    }
    if (this.selectedChannel) {
      return `Nachricht an #${this.selectedChannel?.name}`;
    }
    return '';
  }

  selectedFile: string | ArrayBuffer | null = null;
  fileName: string = '';

  handleSelectedFile(event: string) {
    this.selectedFile = event;

    if (this.selectedFile.includes('image/')) {
      this.image = this.selectedFile;
    } else if (this.selectedFile.includes('application/pdf')) {
      this.pdf = this.selectedFile;
    } else {
      this.image = '';
      this.pdf = '';
    }

    this.getPlaceholderText();
  }

  handleFileName(event: string) {
    this.fileName = event;
  }

  hasLinkedUsers(): boolean {
    return this.linkedUsers.length > 0;
  }

  handleLinkedUsernames(users: DABubbleUser[]) {
    users.forEach((user) => {
      if (!this.textareaValue.includes(`@${user.username}' `)) {
        this.textareaValue += `@${user.username}' `;
      }
    });
  }

  handleSelectedEmoji(event: string) {
    this.textareaValue += event + ' ';
  }
}
