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
export class ScoreSender {

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
        const user = await this.storage.get('linkedUser');
        const phone_id = user ? user.codigo_app : user;
        const date = moment().format('YYYY-MM-DD hh:mm:ss');
        await this.sendPostRequest(pendingScores, phone_id, date);
    }

    async sendPostRequest(pendingScores: any[], phone_id: string | number, datetime: string){
        console.log('Sending cores');
        const data = this.generateUpdateScoreBody(pendingScores, phone_id, datetime);
        const httpOptions = {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        };

        this.httpClient.post(Constants.UPDATE_REGISTRY_URL, data, httpOptions)
        .toPromise().then(response => {
            pendingScores.forEach(score => {
                this.database.updateScoreStatus(score.id, 'SENT');
            });
        }).catch(error => {
            console.log("Error when updating", error);
            //TODO check if the register hasn't been created. If it hasn't, create it and send the method again
            //TODO if the error isn't about register, pass
            const data = this.generateInsertScoreBody(phone_id, datetime);
            this.httpClient.post(Constants.INSERT_REGISTRY_URL, data, httpOptions)
            .toPromise().then(response => {
                console.log('SUCCESS CREATE', response);
            }).catch(error => {
                console.log('error when creating scores', error);
            });
        });
    }

    generateUpdateScoreBody(pendingScores: any[], phone_id: string | number, datetime: string){
        const values = {};
        pendingScores.forEach(score => {
            values[`score_${score.hour}`] = score.score;
        });
        const data = {
            "tabla": "integracion_score_diario",
            "operador": "and",
            "valores": values,
            "condiciones": [
                {
                    "columna": "telefono_id",
                    "comparador": "==",
                    "valor": phone_id
                },
                {
                    "columna": "dia",
                    "comparador": "==",
                    "valor": datetime
                }
            ]
        };
        return JSON.stringify(data);
    }

    generateInsertScoreBody(phone_id: string | number, datetime: string){
        const data = {
            "tabla": "integracion_score_diario",
            "datos": [
            {
                "telefono_id": phone_id,
                "dia": datetime,
                "score_0": 20
            }
            ]
        };
        return JSON.stringify(data);
    }

}
