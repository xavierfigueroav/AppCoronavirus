import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';

/*
  Generated class for the StorageManagerProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class StorageProvider {

    constructor(private storage: Storage) {
        console.log('Hello StorageManagerProvider Provider');
    }

    get(key: string) {
        return new Promise<any>((resolve, reject) => {
            let currentUser: string;
            this.storage.get('user').then(user => {
                currentUser = user;
                return this.storage.get('users');
            }).then(users => {
                users = JSON.parse(users);
                console.log(users, currentUser, key, users[currentUser][key]);
                resolve(users[currentUser][key]);
            }).catch(error => reject(error));
        });
    }

    getUser() {
        return this.storage.get('user');
    }

    getDatasetId() {
        return this.storage.get('datasetId');
    }

    getNotifications() {
        return this.storage.get('notifications');
    }

    getCurrentScore() {
        return this.storage.get('currentScore');
    }

    set(key: string, value: any) {
        return new Promise<any>((resolve, reject) => {
            let currentUser: string;
            this.storage.get('user').then(user => {
                currentUser = user;
                return this.storage.get('users');
            }).then(users => {
                users = JSON.parse(users);
                console.log('USERS', users);
                users[currentUser][key] = value;
                console.log('USERS 2', users, currentUser, key, value);
                return this.storage.set('users', JSON.stringify(users));
            }).then(result => resolve(result)).catch(error => reject(error));
        });
    }

    setUser(user: string) {
        return this.storage.set('user', user);
    }

    setUserData(user: string) {
        return new Promise<any>((resolve, reject) => {
            this.storage.get('users').then(users => {
                if (users != null) {
                    users[user] = users[user] || { 'user': user };
                    return this.storage.set('users', JSON.stringify(users));
                }
                const newUsers = {};
                newUsers[user] = { 'user': user };
                return this.storage.set('users', JSON.stringify(newUsers));
            }).then(result => resolve(result)).catch(error => reject(error));
        });
    }

    setDatasetId(datasetId: string) {
        return this.storage.set('datasetId', datasetId);
    }

    setNotifications(notifications: any[]) {
        return this.storage.set('notifications', notifications);
    }

    setCurrentScore(currentScore: number) {
        return this.storage.set('currentScore', currentScore);
    }

    forEach(exec: any) {
        this.storage.forEach(exec);
    }
}
