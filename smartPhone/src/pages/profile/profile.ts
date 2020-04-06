import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';
import { Storage } from '@ionic/storage';

import { Clipboard } from '@ionic-native/clipboard';
import { SurveyPage } from '../survey/survey';

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

  constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App, private storage: Storage, private clipboard: Clipboard) {
  }

  ngOnInit() {
      this.hideCopyMessage = true;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProfilePage');
  }

  cerrarSesion() {
    this.storage.get('linkedUser').then((val) => {
        this.storage.set('linkedUser', null).then(data => {
            this.appCtrl.getRootNav().setRoot(AuthPage);
        });
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

    clickOnSurveyHandler() {

        this.navCtrl.push(SurveyPage);

    }

}
