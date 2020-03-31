import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';

@Component({
	selector: 'page-user',
	templateUrl: 'user.html',
})

export class UserPage {

	constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App, private storage: Storage) {
	}

	ionViewDidLoad() {
		console.log('ionViewDidLoad UserPage');
	}

	cerrarSesion() {
        this.storage.get('linkedUser').then((val) => {
            this.storage.set('linkedUser', null).then(data => {
                this.appCtrl.getRootNav().setRoot(AuthPage);
            });
        });
    }

}
