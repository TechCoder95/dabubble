import { Component, Input, OnInit } from '@angular/core';
import { LoginComponent } from "./login/login.component";
import { UserService } from '../../shared/services/user.service';
import { AuthenticationService } from '../../shared/services/authentication.service';
import { SidenavComponent } from "../../tristan/sidenav/sidenav.component";
import { HeaderComponent } from "../../shared/components/header/header.component";
import { VariableContentComponent } from "./variable-content/variable-content.component";
import { Router } from '@angular/router';
import { EmailService } from '../../shared/services/sendmail.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LoginComponent, SidenavComponent, HeaderComponent, VariableContentComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
