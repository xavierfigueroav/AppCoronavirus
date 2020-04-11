import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, App } from 'ionic-angular';
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

    scores: any;
    status: string;
    currentScore: number;
    currentScoreColor: string;
    homeLocationDate: number;
    colors: any;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public appCtrl: App,
        private storage: Storage,
        public alertCtrl: AlertController,
        private location: LocationProvider,
        private database: DatabaseService,
        private scoreService: ScoreProvider
        ) { }

    ngOnInit() {
        console.log('ngOnInit UserPage');

        this.colors = {'1': '#32c800', '2': '#FFC800', '3': '#FF0000', '-1': '#999999'};
        this.scoreService.calculateAndStoreExpositionScores();

        this.storage.get('homeLocation').then(location => {
            this.homeLocationDate = location ? location.date : undefined;
        });

        this.storage.get('partialScore').then(currentScore => {
            this.currentScore = currentScore;
            this.currentScoreColor = this.getColorByScore(currentScore);
        })

        this.database.getScores().then(scores => {
            scores.forEach(score => {
                score.color = this.getColorByScore(score.score);
            });

            this.scores = scores;

            for(let i = scores.length + 1; i < 25; i++){
                const missingScore = {'hour': i, 'score': -1};
                missingScore['color'] = this.getColorByScore(missingScore.score);
                this.scores.push(missingScore);
            }
        })
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

    async registerHomeHandler() {

        const numberOfWifiNetworks = await this.scoreService.startScan();
        await this.storage.set('homeWifiNetworks', numberOfWifiNetworks);

        this.location.getCurrentLocation().then(location => {

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

        }).catch(() => {
            this.alertCtrl.create({
                title: 'La ubicación de tu casa no fue almacenada',
                subTitle: 'Sin la ubicación de tu casa no podemos brindarte información actualizada sobre tu nivel de exposición.',
                buttons: ['OK']
            }).present();
        });
    }
}
