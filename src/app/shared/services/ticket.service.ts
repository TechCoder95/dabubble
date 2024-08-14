import { Injectable } from '@angular/core';
import { ThreadMessage } from '../interfaces/threadmessage';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})

export class TicketService {
  private _ticket: any;

  constructor(private databaseService: DatabaseService) {}

  setTicket(ticket: any) {
    this._ticket = ticket;
    }

  getTicket() {
    return this._ticket;
  }

  async sendThreads(thread: ThreadMessage) {
    await this.databaseService.addDataToDB('threads', thread);
    console.log("finde ich hier etwas? ",this.databaseService.addDataToDB('threads', thread));
    
  }
}
