import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DABubbleUser } from '../../../../shared/interfaces/user';

@Component({
  selector: 'app-link-channel-member',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './link-channel-member.component.html',
  styleUrl: './link-channel-member.component.scss',
})
export class LinkChannelMemberComponent{
  @Input() usersInChannel!: DABubbleUser[];
  @Input() addLinkImg!: string;
  @Output() users = new EventEmitter<DABubbleUser[]>();
  linkWindowOpen: boolean = false;

  openWindow() {
    this.linkWindowOpen = !this.linkWindowOpen;
  }

  selectedUsers: DABubbleUser[] = [];
  toggleUsername(event: Event, user: DABubbleUser) {
    event.stopPropagation();
    let checkbox = this.getCheckbox(event);
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        this.selectedUsers.push(user);
      } else {
        this.deleteUserFromArray(user);
      }
    }
    this.users.emit(this.selectedUsers);
    this.selectedUsers = [];
  }

  getCheckbox(event: Event) {
    return (event.currentTarget as HTMLElement).querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
  }

  deleteUserFromArray(user: DABubbleUser) {
    let index = this.selectedUsers.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  toggleAllUsernames(event: Event) {
    event.stopPropagation();
    let checkboxToSelectAll = this.getCheckbox(event);

    if (checkboxToSelectAll) {
     /*  checkboxToSelectAll.checked = !checkboxToSelectAll.checked;
      let isChecked = checkboxToSelectAll.checked;

      let checkboxes = this.getAllCheckboxes();

      checkboxes.forEach((checkbox: HTMLInputElement) => {
        checkbox.checked = isChecked;
        this.handleEachCheckbox(checkbox, isChecked);
      }); */

      this.usersInChannel.forEach((user) => {
        this.selectedUsers.push(user);
      });
    }
    this.users.emit(this.selectedUsers);
    this.selectedUsers = [];
    this.linkWindowOpen = false;
  }

 /*  getAllCheckboxes() {
    return Array.from(
      document.querySelectorAll('.username-checkbox input[type="checkbox"]'),
    ) as HTMLInputElement[];
  } */

 /*  handleEachCheckbox(checkbox: HTMLInputElement, isChecked: boolean) {
    let userId = checkbox.getAttribute('id');
    let user: DABubbleUser | undefined = this.usersInChannel.find(
      (u) => u.id === userId,
    );
    if (user) {
      if (isChecked) {
        if (!this.selectedUsers.some((u) => u.id === user.id)) {
          this.selectedUsers.push(user);
        }
      } else {
        this.deleteUserFromArray(user);
      }
    } */
  }
