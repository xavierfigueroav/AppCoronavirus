import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AuthPage } from '../auth/auth';

@Component({
	selector: 'page-user',
	templateUrl: 'user.html',
})

export class UserPage implements OnInit{

    counter: number;
    ringColor: string;
    scores: any;

	constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App, private storage: Storage) {
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
        this.counter = 0.0;
        setInterval(() => {
            this.ringColor = this.getColorByScore(this.counter);
            this.counter = (this.counter + 0.01) % 1;
        }, 125);

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
}
