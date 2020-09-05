import { Component, OnInit } from '@angular/core';
import { App } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { AuthPage } from '../auth/auth';
import { ScoreProvider } from '../../providers/score/score';


@Component({
	selector: 'page-information',
	templateUrl: 'information.html',
})

export class InformationPage implements OnInit{

    segment: string;

	constructor(
        private app: App,
        private storage: StorageProvider,
        private scoreProvider: ScoreProvider) {
    }

    ngOnInit() {
        this.segment = 'maps';
    }

	logout() {
        this.storage.setUser(null).then(() => {
            this.scoreProvider.backgroundGeolocation.stop();
            this.app.getRootNav().setRoot(AuthPage);
        });
    }
}
