import { Component, OnInit, NgZone } from '@angular/core';
import { App, Events, ModalController } from 'ionic-angular';
import { StorageProvider } from '../../providers/storage/storage';
import { AuthPage } from '../auth/auth';
import { ScoreProvider } from '../../providers/score/score';
import { AlertProvider } from '../../providers/alert/alert';

import { DatabaseProvider } from '../../providers/database/database';
import { HomeInformationComponent } from '../../components/home-information/home-information';

@Component({
	selector: 'page-user',
    templateUrl: 'user.html',
})

export class UserPage implements OnInit{

    currentScore: number;
    currentScoreColor: string;
    ableToTrack: boolean;
    latitude: number;
    longitude: number;
    homeArea: number;
    scores: any;
    colors: any;

    log: any;

    constructor(
        private app: App,
        private storage: StorageProvider,
        private database: DatabaseProvider,
        private scoreProvider: ScoreProvider,
        private events: Events,
        private ngZone: NgZone,
        private alert: AlertProvider,
        private modalController: ModalController
    ) {
            this.events.subscribe('scoreChanges', (score: number) => {
                this.updateCurrentScore(score);
                this.fillScores();
            });

            this.events.subscribe('log', (log: any) => {
                this.ngZone.run(() => {
                    this.log = {... this.log, ...log };
                });
            });
         }

    ngOnInit() {
        console.log('ngOnInit UserPage');
        this.log = {};
        this.colors = {'0':'#49BEAA','1': '#49BEAA', '2': '#EEB868', '3': '#EF767A', '-1': '#999999'};
        const scores = [];
        for(let i = 0; i < 24; i++) {
            scores.push({ color: '#999999' });
        }
        this.scores = scores; // Default score bar while waiting for stored scores
    }

    ionViewWillEnter() {
        console.log('ionViewWillEnter UserPage');
        this.refreshScores();
    }

    async refreshScores(refresher = undefined) {
        console.log('refreshing scores...');
        const homeArea = await this.storage.get('homeArea');
        if(homeArea) {
            this.ableToTrack = true;
            const currentScore = await this.storage.getCurrentScore();
            this.updateCurrentScore(currentScore);
            this.fillScores();
            await this.scoreProvider.updateScores();
        }
        await this.fillScores();
        refresher && refresher.complete();
    }

    async fillScores() {
        const scores = await this.database.getTodayScores();
        scores.forEach(score => {
            score.color = this.getColorByScore(score.score);
        });

        let scoresToShow = scores;

        for(let i = scoresToShow.length; i < 24; i++){
            const missingScore = {'hour': i, 'score': -1};
            missingScore['color'] = this.getColorByScore(missingScore.score);
            scoresToShow.push(missingScore);
        }

        this.updateScores(scoresToShow);
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
        modal.onWillDismiss(() => {
            this.storage.get('homeLocation').then(location => {
                if(location) {
                    this.ableToTrack = true;
                }
            });
        });
    }

    scoreInformation(){
        this.alert.scoreInformation();
    }
}
