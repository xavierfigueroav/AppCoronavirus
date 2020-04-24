import { Component } from '@angular/core';
import { UserPage } from '../user/user';
import { MedicalPage } from '../medical/medical';
import { NavParams, NavController } from 'ionic-angular';
import { FormPage } from '../form/form';
import { ScoreProvider } from '../../providers/score/score';

@Component({
	templateUrl: 'tabs.html'
})

export class TabsPage {
	user = UserPage;
    medical = MedicalPage;
    forms = FormPage;
    selectedIndex: number;

    constructor(private navCtrl: NavController,
        private navParams: NavParams,
        private scoreService: ScoreProvider) {

        this.selectedIndex = this.navParams.get('tabIndex') || 0;
        this.scoreService.backgroundGeolocation.checkStatus().then(status => {
            console.log('BackgroundGeolocation status...', status.isRunning);
            if(!status.isRunning) {
                this.scoreService.startBackgroundGeolocation();
            }
        });
    }

    goToForm() {
        this.navCtrl.setRoot(FormPage, { 'formType': 'initial' });
    }
}
