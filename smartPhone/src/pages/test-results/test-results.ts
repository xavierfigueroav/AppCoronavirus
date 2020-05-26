import { Component, OnInit } from '@angular/core';
import { App } from 'ionic-angular';
import { AuthPage } from '../auth/auth';

import { StorageProvider } from '../../providers/storage/storage';
import { APIProvider } from '../../providers/api/api';
import { ScoreProvider } from '../../providers/score/score';

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
    usersInfo: any[] = [];
    testFound: boolean;
    testStatuses = { 0: 'EN PROCESO', 1: 'PROCESADA' };
    testResults = { 0: 'NEGATIVO', 1: 'POSITIVO', 2: 'INCONCLUSO', 3: 'PENDIENTE' };

    constructor(
        private app: App,
        private storage: StorageProvider,
        private api: APIProvider,
        private scoreProvider: ScoreProvider) {
    }

    ngOnInit() {
        this.testFound = true;
        this.searchTestResults();
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad TestResultsPage');
    }

    logout() {
        this.storage.setUser(null).then(() => {
            this.scoreProvider.backgroundGeolocation.stop();
            this.app.getRootNav().setRoot(AuthPage);
        });
    }

    searchTestResults(){
        this.storage.getUser().then(user => {
            this.api.getTestResultsByAppId(user).then(results => {
                console.log("Results",results);
                this.usersInfo = [];
                if(results) {
                    var resultsMap = {string:[]};
                    results.forEach((result)=>{
                        if(result.cedula in resultsMap){
                            resultsMap[result.cedula].push(result);
                        }else{
                            resultsMap[result.cedula] = [result];
                        }
                        this.usersInfo.push([result.cedula,result.referencia,result.muestra_id]);

                    });
                    //sort by date
                    for(const userId of Object.keys(resultsMap)){
                        resultsMap[userId] = resultsMap[userId].sort((a, b) => (a.fecha_recoleccion > b.fecha_recoleccion) ? 1
                                                      : (a.fecha_recoleccion === b.fecha_recoleccion) ? ((a.muestra_id > b.muestra_id) ? 1 : -1) : -1 );
                    }
                    this.testsResultsMap = resultsMap;
                    console.log("Tests Result Map",this.testsResultsMap);
                    console.log("lista de usersIds",this.usersInfo);
                } else {
                    this.testFound = false;
                }
            }).catch(error => {
                console.log('ERROR AL BUSCAR LA PRUEBA', error);
            });
        });
    }
}
