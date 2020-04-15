import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, NavParams, App, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';
import { AlertController } from 'ionic-angular';
import { LocationProvider } from '../../providers/location/location';
import { DatabaseService } from '../../service/database-service';
import { ScoreProvider } from '../../providers/score/score';
import { APIProvider } from '../../providers/api/api';

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
        private api: APIProvider,
        private events: Events,
        private ngZone: NgZone
        ) {
            this.events.subscribe('scoreChanges', (score: number) => {
                this.updateCurrentScore(score);
                this.updateCurrentScoreColor(score);
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

            let scoresToShow = scores;

            for(let i = scoresToShow.length + 1; i < 25; i++){
                const missingScore = {'hour': i, 'score': -2};
                missingScore['color'] = this.getColorByScore(missingScore.score);
                scoresToShow.push(missingScore);
            }

            this.updateScores(scoresToShow);
        });
    }

    updateCurrentScore(score: number) {
        this.ngZone.run(() => {
            this.currentScore = score || -2;
        });
    }

    updateCurrentScoreColor(score: number) {
        this.ngZone.run(() => {
            this.currentScoreColor = this.getColorByScore(score);
        });
    }

    updateScores(scores: any[]) {
        this.ngZone.run(() => {
            this.scores = scores;
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
                this.homeLocationDate = location.timestamp;

                return this.storage.set('homeLocation', {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    date: location.timestamp
                });
            }).then(() => {
                this.alertCtrl.create({
                    title: 'La ubicación de tu casa fue almacenada exitósamente',
                    subTitle: 'Esto nos permitirá brindarte información actualizada sobre tu nivel de exposición.',
                    buttons: ['OK']
                }).present();

                this.showingForm = false;
                this.api.postHomeInformation();
                this.scoreService.startBackgroundGeolocation();
                this.scoreService.calculateAndStoreExpositionScores();
            }).catch(() => {
                this.alertCtrl.create({
                    title: 'Ocurrió un problema al almacenar lar ubicación de tu casa',
                    subTitle: 'Inténtalo de nuevo. Sin ella no prodremos brindarte información actualizada sobre tu nivel de exposición.',
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

    scoreInformation(){
        const alert = this.alertCtrl.create({
            title: 'Nivel de exposición según los colores',
            subTitle: "<br/><li>Bajo: verde</li>"+
                      "<li>Medio: naranja</li>"+
                      "<li>Alto: rojo</li>",
            buttons: ['OK']
          });
          alert.present();
    }
}
