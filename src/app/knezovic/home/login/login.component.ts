import { Component } from '@angular/core';
import { DABubbleUser } from '../../../shared/interfaces/user';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { EmailService } from '../../../shared/services/sendmail.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(private UserService: UserService, private router: Router, public authService: AuthenticationService) {
    this.UserService.activeUserObserver$.subscribe((user) => {
      if (sessionStorage.getItem('userLogin') || sessionStorage.getItem('userLoginGuest')) {
        this.router.navigate(['/home']);
      }
    });
  }

  email: string = '';
  epassword: string = '';

  get user(): DABubbleUser {
    return this.UserService.activeUser;
  }

  /**
   * Initiates the Google login process.
   */
  googleLogin() {
      this.authService.googleSignIn();
  }


  /**
   * Handles the form submission event.
   * @param ngForm - The NgForm object representing the form.
   */
  onSubmit(ngForm: NgForm) {
    if (ngForm.submitted && ngForm.form.valid) {
        this.login();
    }
    else {
      console.info('Form is not valid');
      ngForm.resetForm();
    }
  }


  /**
   * Performs the login operation.
   */
  login() {
    this.authService.mailSignIn(this.email, this.epassword)
  }


  /**
   * Gets all the users.
   * @returns An array of users.
   */
  get allUsers() {
    return this.UserService.users;
  }


  /**
   * Navigates to the registration page.
   */
  goToRegister() {
    this.authService.registerProcess = true;
    this.router.navigate(['/user/register']);
  }


  loginAsGuest() {
      this.authService.signInAsGuest();
  }


  forgotPW() {
    this.authService.registerProcess = true;
    this.router.navigate(['/user/password-reset']);
  }


  changeInput() {
    this.authService.fehlerMeldung = "";
  }
}
