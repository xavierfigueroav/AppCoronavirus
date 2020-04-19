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
    testsResultsMap: {};
    usersIds: any[];
    testFound: boolean;
    testStatuses = { 0: 'EN PROCESO', 1: 'TERMINADA' };
    testResults = { 0: 'NEGATIVO', 1: 'POSITIVO' };

  constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App,
    private storage: Storage, private api: APIProvider, private alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.testFound = true;
    this.searchTestResults();
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

    searchTestResults(){
        this.storage.get("linkedUser").then(user=>{
            this.api.getTestResultsByAppId(user.codigo_app).then(results => {
                console.log(user.codigo_app);
                console.log(results);
                if(results) {
                    var resultsMap = {string:[]};
                    results.forEach(function(result){
                        if(result.cedula){
                            if(result.cedula in resultsMap){
                                resultsMap[result.cedula].push(result);
                            }else{
                                resultsMap[result.cedula] = [result];
                            }
                        }else{
                            if(result.referencia in resultsMap){
                                resultsMap[result.referencia].push(result);
                            }else{
                                resultsMap[result.referencia] = [result];
                            }
                        }
                        
                    });
                    //sort by date
                    for(const userId of Object.keys(resultsMap)){
                        resultsMap[userId] = resultsMap[userId].sort((a, b) => (a.fecha_recoleccion > b.fecha_recoleccion) ? 1 
                                                      : (a.fecha_recoleccion === b.fecha_recoleccion) ? ((a.muestra_id > b.muestra_id) ? 1 : -1) : -1 );
                    }
                    this.testsResultsMap = resultsMap;
                    console.log(this.testsResultsMap);
                    this.usersIds =  Object.keys(this.testsResultsMap);
                } else {
                    this.testFound = false;
                }
            }).catch(error => {
                console.log('ERROR AL BUSCAR LA PRUEBA', error);
            });
        });
    }

}
