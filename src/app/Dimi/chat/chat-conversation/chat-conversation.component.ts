import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ReceiveChatMessageComponent } from './receive-chat-message/receive-chat-message.component';
import { SendChatMessageComponent } from './send-chat-message/send-chat-message.component';
import { ChatService } from '../../../shared/services/chat.service';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../shared/interfaces/chatmessage';
import { DABubbleUser } from '../../../shared/interfaces/user';
import { UserService } from '../../../shared/services/user.service';
import { ChannelService } from '../../../shared/services/channel.service';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../../shared/services/database.service';

@Component({
  selector: 'app-chat-conversation',
  standalone: true,
  imports: [
    ReceiveChatMessageComponent,
    SendChatMessageComponent,
    CommonModule,
  ],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss',
})
export class ChatConversationComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @Output() receiveChatMessage!: string;
  @Output() sendChatMessage!: string;
  activeUser!: DABubbleUser;
  sendChatMessages: ChatMessage[] = [];
  receiveChatMessages: ChatMessage[] = [];
  allMessages: ChatMessage[] = [];

  @Input() selectedChannel: any;

  private sendMessagesSubscription!: Subscription;
  private receiveMessagesSubscription!: Subscription;
  private activeUserSubscription!: Subscription;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  isPrivate: boolean = this.channelService.channel.isPrivate;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private channelService: ChannelService,
    private databaseService: DatabaseService
  ) {}

  ngOnInit() {
    this.selectedChannel.subscribe((channel: any) => {
      this.chatService.sortMessages(channel);
      this.allMessages = [];
    });
    this.subscribeToSendMessages();
    this.subscribeToReceiveMessages();
    this.subscribeToActiveUser();
  }

  ngAfterViewChecked(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    /*  setTimeout(() => {
      this.scrollToBottom();
    }, 1000); */
  }

  checkDate(timestamp: number): string {
    let messageDate = new Date(timestamp);
    return messageDate.toLocaleDateString();
  }

  groupMessagesByDate() {
    let groupedMessages: any = {};
    this.allMessages.forEach((message) => {
      let date = this.checkDate(message.timestamp);
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].push(message);
    });
    return groupedMessages;
  }

  formatDateWithDay(timestamp: any): string {
    const messageDate = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Berlin',
    };
    return messageDate.toLocaleDateString('de-DE', options);
  }

  scrollToBottom() {
    this.scrollContainer.nativeElement.scrollTop =
      this.scrollContainer.nativeElement.scrollHeight;
  }

  subscribeToActiveUser() {
    if (this.activeUserSubscription) {
      return;
    }
    this.activeUserSubscription =
      this.userService.activeUserObserver$.subscribe((user) => {
        if (user) {
          this.activeUser = user;
        }
      });
  }

  subscribeToSendMessages() {
    if (this.sendMessagesSubscription) {
      return;
    }
    this.sendMessagesSubscription = this.chatService.sendMessages$.subscribe(
      (message) => {
        if (message) {
          this.allMessages.push(message);
        }
      }
    );
  }

  subscribeToReceiveMessages() {
    if (this.receiveMessagesSubscription) {
      return;
    }
    this.receiveMessagesSubscription =
      this.chatService.receiveMessages$.subscribe((message) => {
        if (message !== null) {
          this.allMessages.push(message);
        }
      });
  }

  ngOnDestroy() {
    if (this.sendMessagesSubscription) {
      this.sendMessagesSubscription.unsubscribe();
    }
    if (this.receiveMessagesSubscription) {
      this.receiveMessagesSubscription.unsubscribe();
    }
  }
}
