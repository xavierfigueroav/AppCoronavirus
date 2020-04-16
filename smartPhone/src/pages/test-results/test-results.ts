import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, App, AlertController } from 'ionic-angular';
import { AuthPage } from '../auth/auth';

import { Storage } from '@ionic/storage';
import { APIProvider } from '../../providers/api/api';

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

    result: any;
    sampleId: string;
    testFound: boolean;
    testStatuses = { 0: 'EN PROCESO', 1: 'TERMINADA' };
    testResults = { 0: 'NEGATIVO', 1: 'POSITIVO' };

  constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App,
    private storage: Storage, private api: APIProvider, private alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.testFound = true;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TestResultsPage');
  }

  cerrarSesion() {
    this.appCtrl.getRootNav().setRoot(AuthPage);
    }

    searchTestResults() {

        if(this.sampleId){

            this.api.getTestResultsBySampleId(this.sampleId).then(result => {
                if(result) {
                    this.result = result;
                    this.testFound = true;
                } else {
                    this.result = undefined;
                    this.testFound = false;
                }
            }).catch(error => {
                console.log('ERROR AL BUSCAR LA PRUEBA', error);
            });


        } else {
            this.alertCtrl.create({
                title: 'Código no válido',
                subTitle: 'El campo no puede estar vacío',
                buttons: ['OK']
            }).present();
        }

    }

}
