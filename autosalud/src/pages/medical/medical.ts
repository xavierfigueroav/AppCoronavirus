import { Component } from '@angular/core';
import { App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';
import { StorageProvider } from '../../providers/storage/storage';
import { FormPage } from '../form/form';
import { ScoreProvider } from '../../providers/score/score';

import * as moment from 'moment';

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

    forms = [];

    constructor(
        private app: App,
        private storage: StorageProvider,
        private scoreProvider: ScoreProvider
    ) { }

    ionViewWillEnter() {
        this.forms = [];
        this.storage.get('formTemplates').then(templates => {
            for(const type of Object.keys(templates)) {
                const template = templates[type][0];
                this.checkForActiveForms(template, type);

            }
        });
    }

    checkForActiveForms(template: any, formType: string) {
        if(template.notifications != null) {
            for(const notification of template.notifications) {
                const startDate = notification.children[0].date;
                const endDate = notification.children[1].date;
                const currentDate = moment().format('YYYY-MM-DD');
                if(currentDate >= startDate && currentDate <= endDate) {
                    this.forms.push({ type: formType, title: template.description });
                }
            }
        }
    }

    goToForm(type: string) {
        this.app.getRootNav().setRoot(FormPage, { 'formType': type });
    }

    logout() {
        this.storage.setUser(null).then(() => {
            this.scoreProvider.backgroundGeolocation.stop();
            this.app.getRootNav().setRoot(AuthPage);
        });
    }
}
