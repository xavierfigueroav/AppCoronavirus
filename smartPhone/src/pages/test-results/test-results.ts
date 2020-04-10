import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';

import { Storage } from '@ionic/storage';

/**
 * Generated class for the TestResultsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-test-results',
  templateUrl: 'test-results.html',
})
export class TestResultsPage implements OnInit {

    resultFound: boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App,
    private storage: Storage) {
  }

  ngOnInit() {
      this.resultFound = false;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TestResultsPage');
  }

  cerrarSesion() {
    this.storage.get('linkedUser').then((val) => {
        this.storage.set('linkedUser', null).then(data => {
            this.appCtrl.getRootNav().setRoot(AuthPage);
        });
    });
    }

}
