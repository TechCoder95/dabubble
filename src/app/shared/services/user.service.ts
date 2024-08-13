import { Injectable } from '@angular/core';
import { DABubbleUser } from '../interfaces/user';
import { DatabaseService } from './database.service';
import { User } from 'firebase/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TextChannel } from '../interfaces/textchannel';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { setDoc, doc } from '@angular/fire/firestore';
import { GlobalsubService } from './globalsub.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  activeUser!: DABubbleUser;
  googleUser!: User;
  guestName: string = 'Guest';

  private selectedUserSubject = new BehaviorSubject<DABubbleUser | null>(null);
  selectedUser$ = this.selectedUserSubject.asObservable();


  avatarSelected: boolean = false;
  collectionName: string = 'users';


  constructor(private DatabaseService: DatabaseService, private router: Router, private globalSubService: GlobalsubService) {
    if (sessionStorage.getItem('userLoginGuest')) {
      this.activeUser = JSON.parse(sessionStorage.getItem('userLoginGuest')!)!;
      this.globalSubService.updateUser(this.activeUser);
      this.DatabaseService.subscribeToUserData(this.activeUser.id!);
    }
    else if (sessionStorage.getItem('userLogin')) {

      //Hier wird der User aus dem SessionStorage geladen
      this.activeUser = JSON.parse(sessionStorage.getItem('userLogin')!);
      this.googleUser = JSON.parse(sessionStorage.getItem('firebase:authUser:AIzaSyATFKQ4Vj02MYPl-YDAHzuLb-LYeBwORiE:[DEFAULT]')!);

      //Hier werden die Observables aktualisiert
      this.globalSubService.updateUser(this.activeUser);
      this.globalSubService.updateGoogleUser(this.googleUser);

      //Hier sind die User abonniert
      this.DatabaseService.subscribeToUserData(this.activeUser.id!);
      this.globalSubService.getGoogleUserObservable().subscribe(googleUser => {
        if (googleUser) {
          this.googleUser = googleUser;
          this.globalSubService.updateGoogleUser(this.googleUser);
        }
      });
    }
  }



  /**
   * Checks the online status of a user.
   * 
   * @param user - The user to check the online status for.
   */
  checkOnlineStatus(user: DABubbleUser) {
    if (user) {
      this.activeUser = user;
      this.globalSubService.updateUser(user);
    } else {
      this.activeUser = null!;
    }
  }


  /**
   * Performs a guest login by generating a unique guest name and writing it to the database.
   */
  guestLogin() {
    let name = this.guestName;
    let i = 1;
    while (this.findGuestsinDB()) {
      name = this.guestName + '_' + i;
      i++;
    }
    this.guestName = name;
    this.writeGuestToDB();
  }


  findGuestsinDB() {
    return false;
    //Todo Dome: Hier die Datenbank nach dem Namen "Guest" durchsuchen
  }


  /**
   * Writes a guest user to the database.
   * 
   * @returns {Promise<void>} A promise that resolves when the guest user is successfully written to the database.
   */
  async writeGuestToDB() {
    let guestUser: DABubbleUser = { mail: this.guestName + '@' + this.guestName + '.de', username: this.guestName, uid: '', isLoggedIn: true, avatar: '/img/4.svg' };

    this.DatabaseService.addDataToDB(this.collectionName, guestUser);
    this.globalSubService.updateUser(this.completeUser(this.activeUser));
    sessionStorage.setItem('userLoginGuest', JSON.stringify(this.activeUser));
    this.updateLoggedInUser();
    this.checkOnlineStatus(this.activeUser);
    this.router.navigate(['/home']);
  }


  /**
   * Logs out the guest user.
   * Removes the user login from the session storage, updates the active user subject,
   * deletes the user data from the database, and reloads the page.
   */
  guestLogout() {
    let id = sessionStorage.getItem('userLoginGuest')!;
    this.activeUser = null!;
    this.DatabaseService.deleteDataFromDB(this.collectionName, id)
      .then(() => {
        sessionStorage.removeItem('userLoginGuest');
      });
  }


  /**
   * Logs in a user using the provided Google user object.
   * If the user is not found in the database, a new user entry is created.
   * If the user is found, the user is logged in and their information is updated.
   * @param googleUser - The Google user object containing the user's information.
   */
  async login(googleUser: User) {
    this.globalSubService.updateGoogleUser(googleUser);
    this.DatabaseService.readDataByField(this.collectionName, 'uid', googleUser.uid).then((user) => {
      this.activeUser = user[0] as unknown as DABubbleUser;
      if (this.activeUser === undefined) {
        this.DatabaseService.addDataToDB(this.collectionName, { mail: googleUser.email, isLoggedIn: true, activeChannels: [], uid: googleUser.uid, username: googleUser.displayName, avatar: "" }).then((id) => {
          this.DatabaseService.readDataByID(this.collectionName, id).then((user) => {
            let x = user as DABubbleUser;
            this.activeUser = x;
            if (this.activeUser.mail === googleUser.email && this.activeUser.id) {
              sessionStorage.setItem('userLogin', JSON.stringify(this.activeUser));
              this.globalSubService.updateUser(this.completeUser(this.activeUser, this.googleUser));
              this.updateLoggedInUser();
              this.router.navigate(['/user/chooseAvatar']);
            }
          });
        }
        );
      }
      else {
        if (this.activeUser.uid === googleUser.uid && this.activeUser.id) {
          sessionStorage.setItem('userLogin', JSON.stringify(this.activeUser));
          this.checkOnlineStatus(this.activeUser);
          this.updateLoggedInUser(this.activeUser);
          this.globalSubService.updateUser(this.activeUser);
          this.router.navigate(['/home']);
        }
      }
    });
  }


/**
 * Completes the user object by filling in missing properties with values from the Google user object.
 * If a property is already present in the user object, it will not be overwritten.
 * 
 * @param user - The user object to be completed.
 * @param googleUser - The Google user object containing additional information.
 * @returns The completed user object.
 */
completeUser(user: DABubbleUser, googleUser ?: User) {
  return user = {
    id: user.id,
    mail: user.mail || googleUser?.email || '',
    username: user.username ? user.username : googleUser?.displayName || '',
    uid: user.uid || googleUser?.uid || '',
    isLoggedIn: user.isLoggedIn || true,
    avatar: user.avatar || '',
  };
}


  /**
   * Updates the logged-in user's status and calls the updateUser method.
   */
  async updateLoggedInUser(loginUser ?: DABubbleUser) {
  if (loginUser) {
    this.activeUser.mail = loginUser!.mail;
  }
  this.activeUser.isLoggedIn = true;
  this.updateUser(this.activeUser);
}


  /**
   * Logs out the user.
   * If the user is logged in as a guest, it calls the `guestLogout` method.
   * Otherwise, it updates the user's data in the database, removes the user login information from local and session storage,
   * clears the selected channel ID from session storage, emits a null value for the active user subject,
   * and navigates to the login page.
   */
  async logout() {
  if (sessionStorage.getItem('userLoginGuest')) {
    this.guestLogout();
  } else {
    let id = JSON.parse(sessionStorage.getItem('userLogin')!).id;
    this.DatabaseService.updateDataInDB(this.collectionName, id, { isLoggedIn: false })
      .then(() => {
        sessionStorage.removeItem('userLogin');
        sessionStorage.removeItem('uId');
        sessionStorage.removeItem('userLogin');
        sessionStorage.removeItem('selectedChannelId');
        this.router.navigate(['/user/login']);
      });
  }
}


  /**
   * Registers a new user with the provided email, username, and uid.
   * @param email - The email of the user.
   * @param username - The username of the user.
   * @param uid - The unique identifier of the user.
   */
  async register(email: string, username: string, uid: string) {
  let data: DABubbleUser = { mail: email, username: username, uid: uid, isLoggedIn: false, avatar: '/img/avatar.svg' };
  await this.DatabaseService.addDataToDB(this.collectionName, data)
}


  /**
   * Updates a user in the database.
   * 
   * @param user - The user object to update.
   * @returns A Promise that resolves when the user is updated.
   */
  async updateUser(user: DABubbleUser) {
  await this.DatabaseService.updateDataInDB(this.collectionName, user.id!, user)
}


/**
 * Updates the username of the active user.
 * 
 * @param {string} username - The new username to be set.
 */
updateUsername(username: string) {
  this.activeUser.username = username;
  this.updateUser(this.activeUser);
}


  /**
   * Deletes a user from the database.
   * @param {string} userID - The ID of the user to be deleted.
   * @returns {Promise<void>} - A promise that resolves when the user is deleted.
   */
  async deleteUser(userID: string) {
  await this.DatabaseService.deleteDataFromDB(this.collectionName, userID)
}


/**
 * Retrieves a user by their ID.
 * @param id - The ID of the user to retrieve.
 * @returns The user object matching the specified ID, or undefined if no user is found.
 */
async getOneUserbyId(id: string): Promise <DABubbleUser> {

  let DAUser = await this.DatabaseService.readDataByID(this.collectionName, id)

  return DAUser as DABubbleUser;
}


  /**
   * Retrieves the channels assigned to a user.
   * 
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of TextChannel objects.
   */
  async getUserChannels(userId: string): Promise < TextChannel[] > {
  const channelsCollectionRef = this.DatabaseService.getDataRef('channels');
  const q = query(channelsCollectionRef, where('assignedUser', 'array-contains', userId));
  const snapshot = await getDocs(q);
  const channels: TextChannel[] = [];
  snapshot.forEach(doc => channels.push(doc.data() as TextChannel));
  return channels;
}


  /**
   * Searches for users by name or email.
   * 
   * @param searchText - The text to search for in the username or email.
   * @returns A promise that resolves to an array of DABubbleUser objects matching the search criteria.
   */
  async searchUsersByNameOrEmail(searchText: string): Promise < DABubbleUser[] > {
  const usersRef = collection(this.DatabaseService.firestore, 'users');
  const q = query(
    usersRef,
    where('username', '>=', searchText),
    where('username', '<=', searchText + '\uf8ff')
  );

  const emailQuery = query(
    usersRef,
    where('mail', '>=', searchText),
    where('mail', '<=', searchText + '\uf8ff')
  );

  const [nameSnapshot, emailSnapshot] = await Promise.all([
    getDocs(q),
    getDocs(emailQuery)
  ]);

  const users: DABubbleUser[] = [];

  nameSnapshot.forEach(doc => {
    const data = doc.data() as DABubbleUser;
    data.id = doc.id;
    users.push(data);
  });

  emailSnapshot.forEach(doc => {
    const data = doc.data() as DABubbleUser;
    data.id = doc.id;
    if (!users.some(user => user.id === data.id)) {
      users.push(data);
    }
  });
  return users;
}


setSelectedUser(user: DABubbleUser | null) {
  this.selectedUserSubject.next(user);
}


getSelectedUser(): DABubbleUser | null {
  return this.selectedUserSubject.value;
}


  async getDefaultUserByUid(uid: string): Promise < DABubbleUser | undefined > {
  const usersRef = collection(this.DatabaseService.firestore, this.collectionName);
  const q = query(usersRef, where('uid', '==', uid));
  const snapshot = await getDocs(q);

  if(snapshot.empty) {
  return undefined;
} else {
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as DABubbleUser;
}
  }


  async addDefaultUserToDatabase(user: DABubbleUser): Promise < void> {
  try {
    const userRef = doc(collection(this.DatabaseService.firestore, this.collectionName));
    user.id = userRef.id;

    await setDoc(userRef, user);
  } catch(err) {
    console.error('Error adding user to DB', err);
    throw err;
  }
}

}
