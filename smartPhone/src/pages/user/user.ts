import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';
import { AlertController } from 'ionic-angular';
import { LocationProvider } from '../../providers/location/location';
import { LocalNotifications } from '@ionic-native/local-notifications';

@Component({
	selector: 'page-user',
	templateUrl: 'user.html',
})

export class UserPage implements OnInit{

    scores: any;
    status: string;
    currentScore: number;
    currentScoreColor: string;
    homeLocationDate: number;

    constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App,
                private storage: Storage, public alertCtrl: AlertController, private location: LocationProvider) {
    }

    ngOnInit() {
        console.log('ngOnInit UserPage');
        this.scores = [
            {hour: 1, score: 0.5 },
            {hour: 2, score: 0.3 },
            {hour: 3, score: 0.2 },
            {hour: 4, score: 0.7 },
            {hour: 5, score: 0.9 },
            {hour: 6, score: 0.3 },
            {hour: 7, score: 0.2 },
            {hour: 8, score: 0.0 },
            {hour: 9, score: 0.4 },
            {hour: 10, score: 0.6 },
            {hour: 11, score: 0.8 },
            {hour: 12, score: 0.1 },
            {hour: 13, score: 0.0 },
            {hour: 14, score: 0.8 },
            {hour: 15, score: 0.9 },
            {hour: 16, score: 0.3 },
            {hour: 17, score: 0.2 },
            {hour: 18, score: 0.7 },
            {hour: 19, score: 0.1 },
            {hour: 20, score: 0.2 },
            {hour: 21, score: 0.1 },
            {hour: 22, score: 0.6 },
            {hour: 23, score: 0.9 },
            {hour: 24, score: 0.5 }
        ];

        this.scores.forEach((score: any) => {
            score.color = this.getColorByScore((score.score));
        });

        this.storage.get('homeLocation').then(location => {
            this.homeLocationDate = location ? location.date : undefined;
        });

        this.currentScore = 0.5;
        this.currentScoreColor = this.getColorByScore(this.currentScore);
    }


    getColorByScore(score: number) {
        if(score <= 0.5) {
            const red = 55 + Math.round(score*400);
            return `rgb(${red},200,0)`;
        } else {
            const green = 200 - Math.round((score - 0.5)*400);
            return `rgb(255,${green},0)`;
        }
    }

	cerrarSesion() {
        this.storage.get('linkedUser').then((val) => {
            this.storage.set('linkedUser', null).then(data => {
                this.appCtrl.getRootNav().setRoot(AuthPage);
            });
        });
    }

    infoActual() {
        const alert = this.alertCtrl.create({
          title: 'Exposicion actual',
          subTitle: 'El valor que se muestra aquí es el nivel de exposición de contagio en la hora actual, mientras más se acerque al 1 hay máyor riesgo de contagio.',
          buttons: ['OK']
        });
        alert.present();
    }

    infoAllDay(){
        const alert = this.alertCtrl.create({
            title: 'Exposición durante las últimas 24 horas',
            subTitle: 'Esta barra muestra el nivel de exposición por cada hora del día, de este modo usted podrá tomar las medidas necesarias.',
            buttons: ['OK']
          });
          alert.present();
    }

    registerHomeHandler() {
        this.location.getCurrentLocation()
        .then(location => {

            this.storage.set('homeLocation', {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                date: location.timestamp
            }).then(() => {
                this.alertCtrl.create({
                    title: 'La ubicación de tu casa fue almacenada exitósamente',
                    subTitle: 'Esto nos permitirá brindarte información actualizada sobre tu nivel de exposición.',
                    buttons: ['OK']
                }).present();

            }).catch(() => {
                this.alertCtrl.create({
                    title: 'Ocurrió un problema al almacenar lar ubicación de tu casa',
                    subTitle: 'Inténtalo de nuevo. Sin ella no prodremos brindarte información actualizada sobre tu nivel de exposición.',
                    buttons: ['OK']
                }).present();
            })

        })
        .catch(() => {
            this.alertCtrl.create({
                title: 'La ubicación de tu casa no fue almacenada',
                subTitle: 'Sin la ubicación de tu casa no podemos brindarte información actualizada sobre tu nivel de exposición.',
                buttons: ['OK']
            }).present();
        });
    }
}
