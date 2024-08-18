import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { DatabaseService } from '../../../services/database.service';
import { ChatMessage } from '../../../interfaces/chatmessage';
import { TextChannel } from '../../../interfaces/textchannel';
import { MatDialog } from '@angular/material/dialog';
import { OpenUserInfoComponent } from '../../../../rabia/open-user-info/open-user-info.component';
import { ChannelService } from '../../../services/channel.service';
import { Router } from '@angular/router';
import { DABubbleUser } from '../../../interfaces/user';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface SearchResult {
  title: string;
  description: any;
}

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss'
})
export class SearchbarComponent implements OnInit {

  private databaseService = inject(DatabaseService);
  private userService = inject(UserService);
  private channelService = inject(ChannelService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  searchInput: string = '';
  searchResults: SearchResult[] = [];
  userSearch: DABubbleUser[] = [];
  channelSearch: TextChannel[] = [];
  messageSearch: ChatMessage[] = [];

  private searchSubject: Subject<string> = new Subject();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300) // 300ms debounce time
    ).subscribe(searchText => {
      this.searchInput = searchText;
      this.searchItems();
    });

  }

  onSearchInputChange(searchText: string) {
    this.searchSubject.next(searchText);
  }



  handleEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearchInputChange(this.searchInput);
    }
  }



  searchItems() {
    this.searchResults = [];
    this.pushUsers();
    // this.pushMessages();
    this.pushChannels();
  }

  pushUsers() {
    this.userService
      .searchUsersByNameOrEmail(this.searchInput)
      .then((results: DABubbleUser[]) => {
        results.forEach(user => {
          let searchItem = {
            title: 'User: ',
            description: user
          }
          this.searchResults.push(searchItem);
        });
      })
      .catch((error) => {
        console.error('Error fetching search results:', error);
      });
  }

  pushChannels() {
    this.databaseService
      .readDataByArray('channels', 'assignedUser', JSON.parse(sessionStorage.getItem('userLogin')!).id)
      .then((results: TextChannel[]) => {
        const newResults = results.filter(channel => channel.name.includes(this.searchInput));
        newResults.forEach(channel => {
          let searchItem = {
            title: 'Channel: ',
            description: channel
          }
          this.searchResults.push(searchItem);
        });
      }).catch((error) => {
        console.error('Error fetching search results:', error);
      });
  }

  pushMessages() {

    //Todo Dome: Implement this

    // let searchItem = {
    //   title: 'Message: ',
    //   description: message.message,
    //   channel: this.channelSearch.find(channel => channel.id === message.channelId)?.name,
    //   id: message.id
    // }
    // this.searchResults.push(searchItem);
  }

  openInfo(user: any) {
    this.dialog.open(OpenUserInfoComponent, {
      data: { member: user },
    });

    this.resetInput();
  }

  openChannel(channel: TextChannel) {
    this.channelService.selectChannel(channel);
    this.router.navigate(['/home/channel', channel.id]);
    this.resetInput();
  }

  scrollToMessage(messageId: string) {
    let message = this.messageSearch.find(message => message.id === messageId);
    let x = message as unknown as ChatMessage;
    if (x.id === messageId) {
      document.getElementById(x.id!)?.scrollIntoView()
      setTimeout(() => {
        document.getElementById(x.id!)!.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      }, 1000);
      setTimeout(() => {
        document.getElementById(x.id!)!.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        this.resetInput();
      }, 2000);
    }
  }

  resetInput() {
    this.searchInput = '';
  }
}