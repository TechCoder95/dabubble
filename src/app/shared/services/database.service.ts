import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  // Firestore Initialization
  firestore: Firestore = inject(Firestore);

  constructor() {}

  /**
   * Retrieves a reference to the specified database collection.
   * 
   * @param {string} collectionName - The name of the database collection.
   * @returns A reference to the specified database collection.
   */
  getDataRef(collectionName: string) {
    return collection(this.firestore, collectionName);
  }

  
  /**
   * Sets the reference to the specified database collection.
   * 
   * @param {string} collectionName - The name of the database collection.
   * @returns A reference to the specified database collection.
   */
  setRef(collectionName: string) {
    return collection(this.firestore, collectionName);
  }


  /**
   * Reads data from the specified database and populates the provided array with the retrieved data.
   * @param {string} collectionName - The name of the database to read data from.
   * @param {any[]} array - The array to populate with the retrieved data.
   * @returns A promise that resolves when the initial data is retrieved and whenever the data changes in the database.
   */
  async readDatafromDB(collectionName: string, array: any[]) {
    if (array.length > 0) {
      array = []
    }
    onSnapshot(this.getDataRef(collectionName), (list) => {
      list.docs.forEach(data => {
          array.push({ id: data.id, ...data.data() });
      });
    });
    return true
  }


  /**
   * Adds data to the specified database.
   * 
   * @param {string} collectionName - The name of the database.
   * @param {any} data - The data to be added to the database.
   * @returns A Promise that resolves when the data is successfully added to the database.
   */
  async addDataToDB(collectionName: string, data: any) {
    await addDoc(this.setRef(collectionName), data)
      .catch((err) => { console.error('Error adding Data', err) })
  }


  /**
   * Updates data in the specified database and document.
   * 
   * @param {string} collectionName - The name of the database.
   * @param {string} docId - The ID of the document.
   * @param {any} data - The data to be updated.
   * @returns {Promise<void>} - A promise that resolves when the data is updated.
   */
  async updateDataInDB(collectionName: string, docId: string, data: any) {
    await updateDoc(doc(this.firestore, collectionName, docId), data)
      .catch((err) => { console.error('Error updating Data', err) })
  }


  /**
   * Deletes data from the specified database and document ID.
   * 
   * @param {string} collectionName - The name of the database.
   * @param {string} docId - The ID of the document to delete.
   * @returns {Promise<void>} - A promise that resolves when the data is deleted successfully.
   */
  async deleteDataFromDB(collectionName: string, docId: string) {
    await deleteDoc(doc(this.firestore, collectionName, docId))
      .catch((err) => { console.error('Error deleting Data', err) })
  }

}
