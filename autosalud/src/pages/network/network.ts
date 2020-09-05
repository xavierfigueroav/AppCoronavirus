import { Component, OnInit } from '@angular/core';
import { App } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { AuthPage } from '../auth/auth';
import { ScoreProvider } from '../../providers/score/score';


@Component({
	selector: 'page-network',
	templateUrl: 'network.html',
})

export class NetworkPage implements OnInit{

    people: any[];

	constructor(
        private app: App,
        private storage: StorageProvider,
        private scoreProvider: ScoreProvider) {
    }

    ngOnInit() {
        this.people = [{'name': 'Maria'}, {'name': 'Papá'}, {'name': 'Mamá'}, {'name': 'Pedro'}]
    }

	logout() {
        this.storage.setUser(null).then(() => {
            this.scoreProvider.backgroundGeolocation.stop();
            this.app.getRootNav().setRoot(AuthPage);
        });
    }

}
