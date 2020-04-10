import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';

import { Storage } from '@ionic/storage';

/**
 * Generated class for the MedicalPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-medical',
  templateUrl: 'medical.html',
})
export class MedicalPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App,
    private storage: Storage) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MedicalPage');
  }

  cerrarSesion() {
    this.storage.get('linkedUser').then((val) => {
        this.storage.set('linkedUser', null).then(data => {
            this.appCtrl.getRootNav().setRoot(AuthPage);
        });
    });
    }

}
