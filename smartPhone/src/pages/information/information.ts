import { Component, OnInit } from '@angular/core';
import { App } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { AuthPage } from '../auth/auth';


@Component({
	selector: 'page-information',
	templateUrl: 'information.html',
})

export class InformationPage implements OnInit{

    segment: string;

	constructor(private app: App, private storage: StorageProvider) {
    }

    ngOnInit() {
        this.segment = 'maps';
    }

	ionViewDidLoad() {
		console.log('ionViewDidLoad InformationPage');
	}

	cerrarSesion() {
        this.storage.setUser(null).then(() => {
            this.app.getRootNav().setRoot(AuthPage);
        });
    }
}
