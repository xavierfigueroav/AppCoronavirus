import { Component } from '@angular/core';
import { UserPage } from '../user/user';
import { MedicalPage } from '../medical/medical';
import { NavParams, NavController } from 'ionic-angular';
import { FormPage } from '../form/form';
import { AboutPage } from '../about/about';

@Component({
	templateUrl: 'tabs.html'
})

export class TabsPage {
	user = UserPage;
    medical = MedicalPage;
    forms = FormPage;
    about = AboutPage;
    selectedIndex: number;

    constructor(private navCtrl: NavController, private navParams: NavParams) {
        this.selectedIndex = this.navParams.get('tabIndex') || 0;
    }

    goToForm() {
        this.navCtrl.setRoot(FormPage, { 'formType': 'initial' });
    }
}
