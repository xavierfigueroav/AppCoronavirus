import { Component } from '@angular/core';
import { NavController, App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';

import { Storage } from '@ionic/storage';
import { TestResultsPage } from '../test-results/test-results';
import { FormPage } from '../form/form';

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

    status: string;

    constructor(private navCtrl: NavController, private app: App, private storage: Storage) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad MedicalPage');
    }

    cerrarSesion() {
        this.storage.get('linkedUser').then((val) => {
                this.storage.set('linkedUser', null).then(data => {
                    this.app.getRootNav().setRoot(AuthPage);
                });
            });
    }

    goToDiagnostic() {
        this.app.getRootNav().setRoot(FormPage, { 'formType': 'follow_up' });
    }

    goToTestResults() {
        this.navCtrl.push(TestResultsPage);
    }
}
