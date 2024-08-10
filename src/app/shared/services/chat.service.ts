import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ChatMessage } from '../interfaces/chatmessage';
import { DatabaseService } from './database.service';
import { TextChannel } from '../interfaces/textchannel';
import { UserService } from './user.service';
import { Emoji } from '../interfaces/emoji';
import { DABubbleUser } from '../interfaces/user';
import { GlobalsubService } from './globalsub.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private sendMessagesEmoji = new BehaviorSubject<Emoji | null>(null);
  public sendMessagesEmoji$ = this.sendMessagesEmoji.asObservable();

  constructor(
    private databaseService: DatabaseService,
    private userService: UserService,
    private subService : GlobalsubService
  ) {}

  async sendMessage(message: ChatMessage) {
    try {
      let messagesFromDb: ChatMessage[] = [];
      // Lese die vorhandenen Nachrichten aus der Datenbank
      await this.databaseService.readDatafromDB('messages', messagesFromDb);
      // Überprüfe, ob eine Nachricht mit der gleichen ID bereits existiert
      const messageExists = messagesFromDb.some((msg) => msg.id === message.id);
      if (!messageExists) {
        // Nachricht existiert nicht, füge sie hinzu
        await this.databaseService.addDataToDB('messages', message);
      }
      // Füge die Nachricht zum Kanal hinzu
      const selectedChannelId = sessionStorage.getItem('selectedChannelId')!;

      const messageId = messageExists
        ? message.id!
        : messagesFromDb.find((msg) => msg.id === message.id)!.id!;
      await this.databaseService.addMessageToChannel(
        selectedChannelId,
        messageId
      );

      messagesFromDb = [];
      // Aktualisiere die Nachrichten aus der Datenbank
      await this.databaseService.readDatafromDB('messages', messagesFromDb);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }
  /* ==================================================================== */
  async sendEmoji(newEmoji: Emoji, message: ChatMessage) {
    let emojisFromDB: Emoji[] = [];

    /* Lese die vorhandenen Emojies aus der Datenbank */
    await this.databaseService.readDatafromDB('emojies', emojisFromDB);

    /* Überprüfen, ob Emoji bei der Nachricht schon existiert */
    if (this.emojiExistsOnMessage(newEmoji, emojisFromDB)) {
      this.handleExistingEmojiOnMessage(newEmoji, emojisFromDB);
    } else {
      this.createNewEmojiOnMessage(newEmoji);
    }
    await this.databaseService.readDatafromDB('emojies', emojisFromDB);
  }

  async createNewEmojiOnMessage(newEmoji: Emoji) {
    /* Wenn Emoji bei Nachricht noch gar nicht existiert */
    newEmoji.id = await this.getNewEmojiId(newEmoji);
    await this.databaseService.addEmojiToMessage(
      newEmoji.messageId,
      newEmoji.id!
    );
    this.sendMessagesEmoji.next(newEmoji);
  }

  handleExistingEmojiOnMessage(
    emoji: Emoji,
   /*  message: ChatMessage, */
    emojisFromDB: Emoji[]
  ) {
    const existingEmoji: any = this.getExistingEmoji(emoji, emojisFromDB);
    /* Überprüfen, ob der activeUser schon reagiert hat */
    debugger;
    if (this.userHasAlreadyReacted(emoji, existingEmoji)) {
      this.eliminateUserReaction(existingEmoji, emoji);
    } else {
      this.addUserReaction(existingEmoji, emoji);
    }
  }

  getExistingEmoji(emoji: Emoji, emojisFromDB: Emoji[]) {
    const foundEmoji = emojisFromDB.find(
      (emojieObject: Emoji) =>
        emojieObject.messageId === emoji.messageId &&
        emojieObject.type === emoji.type
    );
    return foundEmoji;
  }

  getExistentDocId(emoji: Emoji, message: ChatMessage, emojisFromDB: Emoji[]) {
    const emojiDoc = emojisFromDB.find(
      (emojieObject) =>
        emojieObject.messageId === message.id &&
        emojieObject.type === emoji.type
    );
    return emojiDoc ? emojiDoc.id : undefined;
  }

  async eliminateUserReaction(existingEmoji: Emoji, emoji: Emoji) {
    debugger;
    existingEmoji.usersIds = existingEmoji.usersIds.filter(
      (userId) => userId !== emoji.usersIds[0]
    );

    if (existingEmoji.usersIds.length === 0) {
      await this.databaseService.deleteDataFromDB('emojies', existingEmoji.id!);
      await this.databaseService.removeEmojiFromMessage(
        existingEmoji.messageId,
        existingEmoji.id!
      );
    } else {
      await this.databaseService.updateDataInDB(
        'emojies',
        existingEmoji.id!,
        existingEmoji
      );
    }
    this.sendMessagesEmoji.next(existingEmoji);
  }

  async addUserReaction(existingEmoji: Emoji, emoji: Emoji) {
    debugger;
    existingEmoji.usersIds.push(emoji.usersIds[0]);
    await this.databaseService.updateDataInDB(
      'emojies',
      existingEmoji.id!,
      existingEmoji
    );
    this.sendMessagesEmoji.next(existingEmoji);
  }

  async getNewEmojiId(emoji: Emoji) {
    const id = await this.databaseService.addChannelDataToDB('emojies', emoji);
    return id;
  }

  emojiExistsOnMessage(emoji: Emoji, emojisFromDB: Emoji[]) {
    const emojiExistsOnMessage = emojisFromDB.some(
      (emojieObject: Emoji) =>
        emojieObject.messageId === emoji.messageId &&
        emojieObject.type === emoji.type
    );
    return emojiExistsOnMessage;
  }

  userHasAlreadyReacted(emoji: Emoji, existingEmoji: Emoji): boolean {
    const userHasAlreadyReacted = existingEmoji.usersIds.includes(
      emoji.usersIds[0]
    );
    return userHasAlreadyReacted;
  }

  /* ========================================================== */
}
