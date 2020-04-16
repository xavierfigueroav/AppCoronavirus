import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';


@Component({
	selector: 'page-network',
	templateUrl: 'network.html',
})

export class NetworkPage implements OnInit{

    people: any[];

	constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App, private storage: Storage) {
    }

    ngOnInit() {
        this.people = [{'name': 'Maria'}, {'name': 'Papá'}, {'name': 'Mamá'}, {'name': 'Pedro'}]
    }

	ionViewDidLoad() {
		console.log('ionViewDidLoad NetworkPage');
	}

	cerrarSesion() {
        this.appCtrl.getRootNav().setRoot(AuthPage);
    }

}
