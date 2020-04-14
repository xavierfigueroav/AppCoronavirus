import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, App, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';
import { AlertController } from 'ionic-angular';
import { LocationProvider } from '../../providers/location/location';
import { DatabaseService } from '../../service/database-service';
import { ScoreProvider } from '../../providers/score/score';

@Component({
	selector: 'page-user',
    templateUrl: 'user.html',
})

export class UserPage implements OnInit{

    currentScore: number;
    currentScoreColor: string;
    homeLocationDate: number;
    scores: any;
    colors: any;
    homeRadius: number;
    showingForm: boolean;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public appCtrl: App,
        private storage: Storage,
        public alertCtrl: AlertController,
        private location: LocationProvider,
        private database: DatabaseService,
        private scoreService: ScoreProvider,
        private events: Events
        ) {
            this.events.subscribe('scoreChanges', (score: number) => {
                this.currentScore = score || -2;
                this.currentScoreColor = this.getColorByScore(this.currentScore);
                this.fillScores();
            });
         }

    ngOnInit() {
        console.log('ngOnInit UserPage');

        this.colors = {'1': '#32c800', '2': '#FFC800', '3': '#FF0000', '-1': '#000000', '-2': '#999999'};
        this.showingForm = true;

        this.storage.get('homeLocation').then(location => {
            if(location) {
                this.homeLocationDate = location.date;
                this.showingForm = false;
                this.scoreService.calculateAndStoreExpositionScores();
            }
        });
        this.fillScores();
    }

    fillScores() {
        this.database.getScores().then(scores => {
            scores.forEach(score => {
                score.color = this.getColorByScore(score.score);
            });

            this.scores = scores;

            for(let i = scores.length + 1; i < 25; i++){
                const missingScore = {'hour': i, 'score': -2};
                missingScore['color'] = this.getColorByScore(missingScore.score);
                this.scores.push(missingScore);
            }
        });
    }

    getColorByScore(score: number) {
        return this.colors[Math.ceil(score)];
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
          subTitle: 'El valor que se muestra aquí es el nivel de exposición de contagio en la hora actual.',
          buttons: ['OK']
        });
        alert.present();
    }

    infoAllDay(){
        const alert = this.alertCtrl.create({
            title: 'Exposición durante las últimas 24 horas',
            subTitle: 'Esta barra muestra el nivel de exposición por cada hora del día.',
            buttons: ['OK']
          });
          alert.present();
    }

    async registerHomeHandler() {
        if(this.homeRadius !== undefined) {

            this.scoreService.startScan().then(numberOfWifiNetworks => {
                console.log('homeWifiNetworks set');
                return this.storage.set('homeWifiNetworks', numberOfWifiNetworks);
            }).then(() => {
                console.log('homeRadius set');
                return this.storage.set('homeRadius', this.homeRadius);
            }).then(() => {
                this.homeRadius = undefined;
                console.log('getCurrentLocation called');
                return this.location.getCurrentLocation();
            }).then(location => {

                console.log('getCurrentLocation resolved');

                this.storage.set('homeLocation', {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    date: location.timestamp
                }).then(() => {
                    this.homeLocationDate = location.timestamp;
                    this.alertCtrl.create({
                        title: 'La ubicación de tu casa fue almacenada exitósamente',
                        subTitle: 'Esto nos permitirá brindarte información actualizada sobre tu nivel de exposición.',
                        buttons: ['OK']
                    }).present();

                    this.showingForm = false;

                    return this.scoreService.backgroundGeolocation.checkStatus();
                }).then(status => {
                    console.log('backgroundGeolocation.checkStatus resolved', status);
                    // if(status.isRunning) {

                    //     this.scoreService.backgroundGeolocation.stop()
                    //     this.scoreService.startBackgroundGeolocation();

                    // } else {
                    //     this.scoreService.startBackgroundGeolocation();
                    // }
                    this.scoreService.startBackgroundGeolocation();
                    this.scoreService.calculateAndStoreExpositionScores();
                }).catch(() => {
                    this.alertCtrl.create({
                        title: 'Ocurrió un problema al almacenar lar ubicación de tu casa',
                        subTitle: 'Inténtalo de nuevo. Sin ella no prodremos brindarte información actualizada sobre tu nivel de exposición.',
                        buttons: ['OK']
                    }).present();
                })

            }).catch(() => {
                this.alertCtrl.create({
                    title: 'La ubicación de tu casa no fue almacenada',
                    subTitle: 'Sin la ubicación de tu casa no podemos brindarte información actualizada sobre tu nivel de exposición.',
                    buttons: ['OK']
                }).present();
            });

        } else {

            this.alertCtrl.create({
                title: 'El radio de tu casa es incorrecto',
                subTitle: 'Ingresa un número entero positivo.',
                buttons: ['OK']
            }).present();
        }
    }

    getDateFromeTimestamp(timestamp: number) {
        const date = new Date(timestamp);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
}
