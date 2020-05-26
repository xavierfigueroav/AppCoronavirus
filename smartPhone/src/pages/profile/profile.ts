import { Component, OnInit } from '@angular/core';
import { App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';
import { StorageProvider } from '../../providers/storage/storage';

import { Clipboard } from '@ionic-native/clipboard';
import { ScoreProvider } from '../../providers/score/score';

/**
 * Generated class for the ProfilePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage implements OnInit {

    hideCopyMessage: boolean;

    constructor(
        private app: App,
        private storage: StorageProvider,
        private clipboard: Clipboard,
        private scoreProvider: ScoreProvider) {
    }

    ngOnInit() {
        this.hideCopyMessage = true;
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad ProfilePage');
    }

    logout() {
        this.storage.setUser(null).then(() => {
            this.scoreProvider.backgroundGeolocation.stop();
            this.app.getRootNav().setRoot(AuthPage);
        });
    }

    clickOnPinHandler(event: any) {
        const text = event.target.value;
        this.hideCopyMessage = false;

        this.clipboard.copy(text).then(() => {
            setTimeout(() => {
                this.hideCopyMessage = true;
            }, 2000);
        });
    }
}
