import { Injectable } from '@angular/core';
import * as Constants from '../../data/constants';
import { Storage } from '@ionic/storage';
import { DatabaseService } from '../../service/database-service';
import { HTTP } from '@ionic-native/http';


/*
  Generated class for the ScoreSenderProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ScoreSender {

  constructor(public database:DatabaseService,
    private storage: Storage,
    public http: HTTP,) {

    console.log('Hello ScoreSenderProvider Provider');
  }

  async sendPendingScoresToServer(){
    var scores = await this.database.getScores(); 
    var pendingScores = {};
    scores.forEach((score) =>{
        if(score.status == "PENDING"){  
            var hour = score.hour;
            if(hour == 24 ) hour = 0 
            pendingScores["score_"+hour] = score.score
        }
    });
    var phone_id = await this.storage.get("phone_id");
    var date = new Date();
    var datetime = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDay()+" 00:00:00";   //i.e. 2020-04-01 00:00:00
    await this.sendPostRequest(pendingScores, phone_id, datetime);
}

async sendPostRequest(pendingScores, phone_id, datetime){
    console.log("Sending cores");
    var data = this.generateUpdateScoreBody(pendingScores, phone_id, datetime)
    this.http.post(Constants.UPDATE_REGISTRY_URL, data, {}).then(res => {
        //TODO  update scores status to SENT
        pendingScores.forEach((score)=>{
            this.database.updateScoreStatus(score.id, "SENT");
        });
    })
    .catch(error => {
        console.log("Error sending scores");
        //TODO check if the register hasn't been created. If it hasn't, create it and send the method again
        //TODO if the error isn't about register, pass
        var data = this.generateInsertScoreBody(phone_id, datetime)
        this.http.post(Constants.INSERT_REGISTRY_URL, data, {} ).then(res => {
            if(res.status == 200){
              this.sendPostRequest(pendingScores,phone_id, datetime);
            }
        });
    });
}

generateUpdateScoreBody(pendingScores, phone_id, datetime){
    var data = {
        "tabla": "integracion_score_diario",
        "operador": "and",
        "valores": pendingScores,
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
    return data;
}

generateInsertScoreBody(phone_id, datetime){
  var data = {
    "tabla": "integracion_score_diario",
    "datos": [
      {
        "telefono_id": phone_id,
        "dia": datetime,
      }
    ]
  };
  return data;
}

}
