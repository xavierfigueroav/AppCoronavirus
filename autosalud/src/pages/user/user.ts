import { Component, OnInit, NgZone } from '@angular/core';
import { App, ModalController } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { AuthPage } from '../auth/auth';
import { ScoreProvider } from '../../providers/score/score';
import { AlertProvider } from '../../providers/alert/alert';

import { HomeInformationComponent } from '../../components/home-information/home-information';

declare var BackgroundGeolocation: any;

@Component({
	selector: 'page-user',
    templateUrl: 'user.html',
})

export class UserPage implements OnInit{

    currentScore: number;
    currentScoreColor: string;
    ableToTrack: boolean;
    scores: any;
    colors = {'1': '#49BEAA', '2': '#EEB868', '3': '#EF767A', '-1': '#999999'};

    constructor(
        private app: App,
        private storage: StorageProvider,
        private scoreProvider: ScoreProvider,
        private ngZone: NgZone,
        private alert: AlertProvider,
        private modalController: ModalController
    ) { }

    ngOnInit() {
        console.log('ngOnInit UserPage');
        const scores = [];
        for(let i = 0; i < 24; i++) {
            const missingScore = this.getMissingScore(i);
            scores.push(missingScore);
        }
        this.scores = scores; // Default score bar while waiting for stored scores
    }

    ionViewWillEnter() {
        console.log('ionViewWillEnter UserPage');
        this.refreshScores();
    }

    async refreshScores(refresher = undefined) {
        if(refresher) {
            BackgroundGeolocation.getScores(scores => {
                console.log("ESTA ES UNA PRUEBA !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.table(scores);
            }, error => {
                console.log("ESTA ES UNA PRUEBA ERROR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", error);
            });
        }
        const homeArea = await this.storage.get('homeArea');
        if(homeArea) {
            this.ableToTrack = true;
            this.updateCurrentScore(1); // Default current score while waiting for stored scores
            this.fillScores();
        }
        refresher && refresher.complete();
    }

    fillScores() {
        BackgroundGeolocation.getScores(scores => {
            if(scores.length > 0) {
                // Update current score based on the last score retrieved
                const lastScore = scores[scores.length - 1];
                this.updateCurrentScore(lastScore.value);

                // Fill missing scores at the beginning
                const scoresToShow = [];
                const firstScore = scores[0];
                for(let i = 0; i < firstScore.hour; i++){
                    const missingScore = this.getMissingScore(i);
                    scoresToShow.push(missingScore);
                }

                // Add real scores
                for(const score of scores) {
                    score.color = this.getColorByScore(score.value);
                    scoresToShow.push(score);
                }

                // Fill missing scores at the end
                for(let i = scoresToShow.length; i < 24; i++){
                    const missingScore = this.getMissingScore(i);
                    scoresToShow.push(missingScore);
                }
                this.updateScores(scoresToShow);
            }
        }, console.log);
    }

    getMissingScore(hour: number) {
        const missingScore = {'hour': hour, 'score': -1};
        missingScore['color'] = this.getColorByScore(missingScore.score);
        return missingScore;
    }

    updateCurrentScore(score: number) {
        this.ngZone.run(() => {
            this.currentScore = score || -1;
            this.currentScoreColor = this.getColorByScore(this.currentScore);
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

	logout() {
        this.storage.setUser(null).then(() => {
            this.scoreProvider.backgroundGeolocation.stop();
            this.app.getRootNav().setRoot(AuthPage);
        });
    }

    showHomeInfoModal() {
        const modal = this.modalController.create(HomeInformationComponent);
        modal.present();
        modal.onWillDismiss(() => this.refreshScores());
    }

    scoreInformation(){
        this.alert.scoreInformation();
    }
}
