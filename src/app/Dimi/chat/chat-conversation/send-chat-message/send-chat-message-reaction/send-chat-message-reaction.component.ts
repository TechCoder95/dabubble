import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ChannelService } from '../../../../../shared/services/channel.service';
import { TicketService } from '../../../../../shared/services/ticket.service';
import { Emoji } from '../../../../../shared/interfaces/emoji';
import { ChatService } from '../../../../../shared/services/chat.service';
import { ChatMessage } from '../../../../../shared/interfaces/chatmessage';
import { DABubbleUser } from '../../../../../shared/interfaces/user';

@Component({
  selector: 'app-send-chat-message-reaction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './send-chat-message-reaction.component.html',
  styleUrl: './send-chat-message-reaction.component.scss',
})
export class SendChatMessageReactionComponent {
  checkMarkImg = './img/message-reaction-check-mark.svg';
  handsUpImg = './img/message-reaction-hands-up.svg';
  addReactionImg = './img/message-reaction-add-reaction.svg';
  answerImg = './img/message-reaction-answer.svg';
  editMessageImg = './img/message-reaction-edit-message.svg';
  showEditMessageDialog: boolean = false;
  isInEditMode: boolean = false;
  messageDeleted: boolean = false;
  emojiType!: string;
  @Output() editModeChange = new EventEmitter<boolean>();
  @Output() deleteStatusChange = new EventEmitter<boolean>();
  @Input() sendMessage!: ChatMessage;
  @Input() user!: DABubbleUser;
  @Input() ticket: any;
  @Input() isPrivate!: boolean | undefined;

  constructor(
    private channelService: ChannelService,
    private ticketService: TicketService,
    private chatService: ChatService
  ) {}

  hoverReaction(type: string, hover: boolean) {
    const basePath = './img/message-reaction-';
    const hoverSuffix = hover ? '-hover' : '';

    // if (type === 'checkMark') {
    //   this.checkMarkImg = `${basePath}check-mark${hoverSuffix}.png`;
    // } else if (type === 'handsUp') {
    //   this.handsUpImg = `${basePath}hands-up${hoverSuffix}.svg`;
    if (type === 'addReaction') {
      this.addReactionImg = `${basePath}add-reaction${hoverSuffix}.svg`;
    } else if (type === 'answer') {
      this.answerImg = `${basePath}answer${hoverSuffix}.svg`;
    } else if (type === 'edit') {
      if (!this.showEditMessageDialog) {
        this.editMessageImg = `${basePath}edit-message${hoverSuffix}.svg`;
      }
    }
  }

  editMessageDialog() {
    this.showEditMessageDialog = !this.showEditMessageDialog;
    if (this.showEditMessageDialog) {
      this.editMessageImg = './img/message-reaction-edit-message-hover.svg';
    } else {
      this.editMessageImg = './img/message-reaction-edit-message.svg';
    }
  }

  editMessage() {
    this.isInEditMode = true;
    this.editModeChange.emit(this.isInEditMode);
  }

  deleteMessage() {
    this.messageDeleted = true;
    this.deleteStatusChange.emit(this.messageDeleted);
  }

  openMessage() {
    this.channelService.showSingleThread = true;
    this.ticketService.setTicket(this.ticket);
  }

  handleEmojis(emojiType: string) {
    let emoji: Emoji = {
      messageId: this.sendMessage.id!,
      type: emojiType,
      usersIds: [this.user.id!],
    };
    this.chatService.sendEmoji(emoji, this.sendMessage);
  }
}