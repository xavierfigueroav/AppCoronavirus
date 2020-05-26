import { Component } from '@angular/core';
import { NavController, App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';
import { StorageProvider } from '../../providers/storage/storage';
import { TestResultsPage } from '../test-results/test-results';
import { FormPage } from '../form/form';
import { ScoreProvider } from '../../providers/score/score';

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

  constructor(
      private navCtrl: NavController,
      private app: App,
      private storage: StorageProvider,
      private scoreProvider: ScoreProvider) {
  }

    ionViewDidLoad() {
        console.log('ionViewDidLoad MedicalPage');
    }

    logout() {
        this.storage.setUser(null).then(() => {
            this.scoreProvider.backgroundGeolocation.stop();
            this.app.getRootNav().setRoot(AuthPage);
        });
    }

    goToDiagnostic() {
        this.app.getRootNav().setRoot(FormPage, { 'formType': 'follow_up' });
    }

    goToTestResults() {
        this.navCtrl.push(TestResultsPage);
    }
}
