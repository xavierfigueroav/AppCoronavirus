import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';


@Component({
	selector: 'page-information',
	templateUrl: 'information.html',
})

export class InformationPage implements OnInit{

    segment: string;

	constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App, private storage: Storage) {
    }

    ngOnInit() {
        this.segment = 'maps';
    }

	ionViewDidLoad() {
		console.log('ionViewDidLoad InformationPage');
	}

	cerrarSesion() {
        this.appCtrl.getRootNav().setRoot(AuthPage);
    }

}
