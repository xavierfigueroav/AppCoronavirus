import { Component, OnInit } from '@angular/core';
import { App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';


@Component({
	selector: 'page-information',
	templateUrl: 'information.html',
})

export class InformationPage implements OnInit{

    segment: string;

	constructor(private app: App, private storage: Storage) {
    }

    ngOnInit() {
        this.segment = 'maps';
    }

	ionViewDidLoad() {
		console.log('ionViewDidLoad InformationPage');
	}

	cerrarSesion() {
        this.storage.get('linkedUser').then((val) => {
            this.storage.set('linkedUser', null).then(data => {
                this.app.getRootNav().setRoot(AuthPage);
            });
        });
    }

}
