import { Component, OnInit } from '@angular/core';
import { App } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { AuthPage } from '../auth/auth';


@Component({
	selector: 'page-network',
	templateUrl: 'network.html',
})

export class NetworkPage implements OnInit{

    people: any[];

	constructor(private app: App, private storage: StorageProvider) {
    }

    ngOnInit() {
        this.people = [{'name': 'Maria'}, {'name': 'Papá'}, {'name': 'Mamá'}, {'name': 'Pedro'}]
    }

	ionViewDidLoad() {
		console.log('ionViewDidLoad NetworkPage');
	}

	cerrarSesion() {
        this.storage.setUser(null).then(() => {
            this.app.getRootNav().setRoot(AuthPage);
        });
    }

}
