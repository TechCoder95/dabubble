import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ChatConversationComponent } from './chat-conversation/chat-conversation.component';
import { ChatInformationComponent } from './chat-information/chat-information.component';
import { TextChannel } from '../../shared/interfaces/textchannel';
import { InputfieldComponent } from './chat-inputfield/inputfield.component';
import { MessageType } from '../../shared/enums/messagetype';
import { GlobalsubService } from '../../shared/services/globalsub.service';
import { Subscription } from 'rxjs';
import { DABubbleUser } from '../../shared/interfaces/user';
import { ThreadComponent } from '../../rabia/thread/thread.component';
import { UserService } from '../../shared/services/user.service';
import { ThreadService } from '../../shared/services/thread.service';
import { ThreadChannel } from '../../shared/interfaces/thread-channel';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChannelService } from '../../shared/services/channel.service';
import { ChatMessage } from '../../shared/interfaces/chatmessage';
import { ThreadConversationComponent } from '../../rabia/thread/thread-conversation/thread-conversation.component';
import { Router } from '@angular/router';
import { MobileService } from '../../shared/services/mobile.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MatCardModule,
    ChatConversationComponent,
    ChatInformationComponent,
    InputfieldComponent,
    ThreadComponent,
    MatProgressSpinnerModule,
    ThreadConversationComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  @Output() selectedChannelFromChat = new EventEmitter<TextChannel>();
  @Output() selectedUserFromChat = new EventEmitter<DABubbleUser>();
  @Output() selectedThreadOwner = new EventEmitter<ThreadChannel>();

  @Output() activeUser!: any;

  channelsub!: Subscription;
  threadsub!: Subscription;

  public readonly channelService = inject(ChannelService);

  messageTypeDirects: MessageType = MessageType.Directs;
  messageType: MessageType = MessageType.Groups;
  showChatComponent!: boolean;
  messageTypeThreads = MessageType.Threads;

  private userService = inject(UserService);

  constructor(
    private subService: GlobalsubService,
    public threadService: ThreadService,
    private router: Router,
    public mobileService: MobileService,
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(): void {
  //    if (this.mobileService.isMobile) {
  //      console.log('Viel Spaß beim Resizen ;-)');
  //      this.router.navigate(['home']);
  //    }
   }

  async ngOnInit() {
    this.selectedUserFromChat.emit(
      JSON.parse(sessionStorage.getItem('userLogin')!),
    );

    this.selectedChannelFromChat.emit(
      JSON.parse(sessionStorage.getItem('selectedChannel')!),
    );

    this.channelsub = this.subService
      .getActiveChannelObservable()
      .subscribe((channel: TextChannel) => {
        this.selectedChannelFromChat.emit(channel);
      });

    if (sessionStorage.getItem('selectedThread')) {
      let selectedPerson = JSON.parse(
        sessionStorage.getItem('selectedThread')!,
      );

      this.userService
        .getOneUserbyId(selectedPerson.userID)
        .then((user: DABubbleUser) => {
          this.selectedUserFromChat.emit(user);
          this.activeUser = user;
        });

      this.selectedThreadOwner.emit(
        JSON.parse(sessionStorage.getItem('selectedThread')!),
      );
    }
  }

  ngOnDestroy() {
    if (this.channelsub) {
      this.channelsub.unsubscribe();
    } else if (this.threadsub) {
      this.threadsub.unsubscribe();
    }
  }

  getStorage() {
    if (sessionStorage.getItem('selectedThread')) {
      return true;
    }
    return false;
  }

  getUrl() {
    return this.router.url;
  }

  windowIsSmall() {
    return window.innerWidth <= 910;
  }
}
