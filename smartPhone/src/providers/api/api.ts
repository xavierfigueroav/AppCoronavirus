import { Injectable } from '@angular/core';
import * as Constants from '../../data/constants';
import { Storage } from '@ionic/storage';
import { DatabaseService } from '../../service/database-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as moment from 'moment';


/*
  Generated class for the ScoreSenderProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class APIProvider {

    constructor(
        private database:DatabaseService,
        private storage: Storage,
        private httpClient: HttpClient
    ) {
        console.log('Hello ScoreSenderProvider Provider');
    }

    async sendPendingScoresToServer(){
        const scores = await this.database.getScores();
        const pendingScores = [];
        scores.forEach(score => {
            if(score.status === 'PENDING'){
                if(score.hour === 24 ) score.hour = 0;
                pendingScores.push(score);
            }
        });

        if(pendingScores.length > 0) {
            const user = await this.storage.get('linkedUser');
            const phone_id = user ? user.codigo_app : user;
            // FIXME: Get date from scores table in database
            const date = moment().format('YYYY-MM-DD hh:mm:ss');
            await this.sendPostRequest(pendingScores, phone_id, date);
        }
    }

    async sendPostRequest(pendingScores: any[], phone_id: string | number, datetime: string){
        console.log('Sending cores');
        const data = this.generateUpdateScoreBody(pendingScores, phone_id, datetime);
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        };

        this.httpClient.post(Constants.UPDATE_REGISTRY_URL, data, httpOptions)
        .toPromise().then((response: any) => {
            console.log('UPDATE RESPONSE', response);
            const updated = response.data.rows_updated;
            if(updated) {
                console.log('UPDATE ON SERVER');
                pendingScores.forEach(score => {
                    this.database.updateScoreStatus(score.id, 'SENT').then(result => {
                        console.log('SUCCESS UPDATE SCORE IN LOCAL DATABASE', result);
                    }).catch(error => {
                        console.log('ERROR UPDATE SCORE IN LOCAL DATABASE', error);
                    });
                });

            } else {
                const data = this.generateInsertScoreBody(phone_id, datetime);
                this.httpClient.post(Constants.CREATE_REGISTRY_URL, data, httpOptions)
                .toPromise().then(response => {
                    console.log('SUCCESS CREATE', response);
                    this.sendPostRequest(pendingScores, phone_id, datetime);
                }).catch(error => {
                    console.log('error when creating scores', error);
                });
            }
        }).catch(error => {
            console.log("Error when updating", error);
        });
    }

    getTestResultsBySampleId(sampleId: string) {
        return new Promise<any>((resolve, reject) => {
            console.log('Requesting tests...');
            const data = this.generateReadTestBody(sampleId);
            const httpOptions = {
                headers: new HttpHeaders({ 'Content-Type': 'application/json' })
            };
            this.httpClient.post(Constants.READ_REGISTRY_URL, data, httpOptions)
            .toPromise().then(response => {
                resolve(response['data'][0]);
            }).catch(error => reject(error));
        });
    }

    generateUpdateScoreBody(pendingScores: any[], phone_id: string | number, datetime: string){
        const values = {};
        pendingScores.forEach(score => {
            values[`score_${score.hour}`] = score.score;
        });
        const data = {
            "tabla": "integracion_score_diario",
            "valores": values,
            "condiciones": [
                {
                    "columna": "telefono_id",
                    "comparador": "==",
                    "valor": phone_id
                }
            ]
        };
        console.log('data update', data);
        return JSON.stringify(data);
    }

    generateInsertScoreBody(phone_id: string | number, datetime: string){
        const data = {
            "tabla": "integracion_score_diario",
            "datos": [
                {
                    "telefono_id": phone_id,
                    "dia": datetime
                }
            ]
        };
        console.log('data create', data);
        return JSON.stringify(data);
    }

    generateReadTestBody(sampleId: string){
        const data = {
            "tabla": "integracion_pruebas",
            "condiciones": [
                {
                    "columna": "muestra_id",
                    "comparador": "==",
                    "valor": sampleId
                }
            ]
        };
        return JSON.stringify(data);
    }

}
