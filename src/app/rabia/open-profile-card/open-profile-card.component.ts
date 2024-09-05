import { Component, inject } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DAStorageService } from '../../shared/services/dastorage.service';
import { EmailService } from '../../shared/services/sendmail.service';

@Component({
  selector: 'app-open-profile-card',
  standalone: true,
  imports: [MatButtonModule, CommonModule, FormsModule],
  templateUrl: './open-profile-card.component.html',
  styleUrl: './open-profile-card.component.scss',
})
export class OpenProfileCardComponent {
  editable: boolean = false;
  emailInput: string = '';
  readonly dialogRef = inject(MatDialogRef<OpenProfileCardComponent>);

  constructor(
    public userService: UserService,
    private daStorage: DAStorageService,
    private emailService: EmailService,
  ) {}

  /**
   * Saves the profile by calling the necessary methods to update the user's profile information.
   * - Calls the `editProfile` method to update the profile.
   * - Calls the `updateUsername` method of the `userService` to update the username of the active user.
   * - Calls the `updateGoogleEmail` method of the `emailService` to update the Google email if the `emailInput` is not empty.
   */
  saveProfile() {
    this.editProfile();
    this.userService.updateUsername(this.userService.activeUser.username!);
    if (this.emailInput != '')
      this.emailService.updateGoogleEmail(this.emailInput);
  }

  /**
   * Toggles the editable state of the profile.
   */
  editProfile() {
    this.editable = !this.editable;
  }

  /**
   * Handles the change event of the avatar input element.
   *
   * @param event - The event object representing the change event.
   */
  changeAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.userService.activeUser.avatar = e.target.result as string;
          this.upload(file);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Uploads a file.
   *
   * @param file - The file to be uploaded.
   */
  upload(file: File) {
    this.daStorage.uploadFile(file, sessionStorage.getItem('uId')!);
  }

  /**
   * Closes the edit mode of the profile card.
   */
  closeEdit() {
    this.editable = false;
  }

  /**
   * Closes the profile card dialog.
   */
  close() {
    this.dialogRef.close();
  }
}
