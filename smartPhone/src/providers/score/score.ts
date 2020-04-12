import { Injectable } from '@angular/core';
import { DatabaseService } from '../../service/database-service';
import { Storage } from '@ionic/storage';
import { WifiScore } from '../../utils_score/wifi_score';
import { DistanceScore } from '../../utils_score/distance_score';
import { ScoreSender } from '../score-sender/score-sender'
import {
    BackgroundGeolocation,
    BackgroundGeolocationResponse,
    BackgroundGeolocationEvents,
    BackgroundGeolocationConfig
} from '@ionic-native/background-geolocation';
import { Events } from 'ionic-angular';

declare var WifiWizard2: any;

/*
  Generated class for the ScoreProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ScoreProvider {

    backgroundGeolocationConfig: BackgroundGeolocationConfig;

    constructor(
        private storage: Storage,
        public backgroundGeolocation: BackgroundGeolocation,
        public database:DatabaseService,
        public scoreSender: ScoreSender,
        private events: Events
        ) {
        console.log('Hello ScoreProvider Provider');
        this.backgroundGeolocationConfig = {
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 1,
            stopOnTerminate: false,
            startOnBoot : true,
            notificationsEnabled: false,
            saveBatteryOnBackground: true
        };
    }

    async startScan(): Promise<number> {
        let num_networks: number;
        if (typeof WifiWizard2 !== 'undefined') {
            console.log("WifiWizard2 loaded: ");
            console.log(WifiWizard2);
        } else {
            console.warn('WifiWizard2 not loaded.');
        }
        await WifiWizard2.scan().then((wifiNetworks: any[]) => {
            console.log("Inside Scan function");
            for (let wifiNetwork of wifiNetworks) {
                const level = wifiNetwork['level'];
                const ssid = wifiNetwork['SSID'];
                const timestamp = wifiNetwork['timestamp'];
                console.log(`Level: ${level} SSID: ${ssid} Timestamp: ${timestamp}`);
            }
            num_networks = wifiNetworks.length;
        }).catch((error: any) => {
            console.log('ERROR SCAN', JSON.stringify(error));
            num_networks = 0;
        });

        return num_networks;
    }


    calculate_exposition_score(
        distance_score: number,
        wifi_score=1,
        density_score=1,
        time_score=1,
        alpha=0.33,
        beta=0.33,
        theta=0.33): number{ //time given in minutes
        const score = distance_score * ((alpha*wifi_score) + (beta*density_score) + (theta*time_score));
        return Number(score.toFixed(2));
    }

    startBackgroundGeolocation() {
        this.storage.get('homeLocation').then(location => {
            if(location) {
                return this.storage.get('homeRadius');
            }
            return null;
        }).then(radius => {
            if(radius){
                this.backgroundGeolocationConfig.distanceFilter = radius;
                this.backgroundGeolocation.configure(this.backgroundGeolocationConfig).then(() => {
                    console.log('Background geolocation => configured');
                    this.backgroundGeolocation
                    .on(BackgroundGeolocationEvents.location)
                    .subscribe((location: BackgroundGeolocationResponse) => {
                        console.log('Movement detected');
                        this.locationHandler(location);
                    });
                });
                this.backgroundGeolocation.start();
                console.log('Background geolocation => started');
            }
        });
    }

    async locationHandler(location: BackgroundGeolocationResponse){
        console.log('Background geolocation => location received');

        const wifiScore = await this.calculateWifiScore();

        this.database.addLocation(location.latitude, location.longitude, location.time, wifiScore);

        this.calculateAndStoreExpositionScores();
    }

    calculateAndStoreExpositionScores() {

        const date = new Date();
        const currentHour = date.getHours();
        this.checkForPendingScores(Number(currentHour));
        this.calcualteDistanceScore(Number(currentHour + 1), false).then(score => {
            this.storage.set('partialScore', score);
            this.events.publish('scoreChanges', score);
        });
        // TODO: Run this.scoreSender.sendPendingScoresToServer();
    }

// Calculate and save the scores only for complete hours
    checkForPendingScores(currentHour: number){

        if(currentHour == 0) currentHour = 24;

        this.database.getScores().then(async (data:any) => {
            if(data){
                const lastScoreHour = data.length;
                if(lastScoreHour > currentHour){ //  if we are in different days, delete previous scores and check again
                    this.database.deleteScores();
                    this.checkForPendingScores(currentHour);
                } else{                          // if we are in the same day, only calculate the score from the last score hour to the current hour
                    for (let hour = lastScoreHour+1; hour < currentHour; hour++) {
                        const score = await this.calcualteDistanceScore(hour);
                        this.database.addScore(score, hour, 0, 0, '');
                        this.database.deleteLocationsByHour(hour);
                    }
                }
            } else{   //there aren't scores yet, calculate all scores until the current hour
                for (let hour = 1; hour < currentHour; hour++) {
                    const score = await this.calcualteDistanceScore(hour);
                    this.database.addScore(score, hour, 0, 0, "");
                    this.database.deleteLocationsByHour(hour);
                }
            }
        });
    }

    async getParameters() : Promise<{}>{
        const homeLocation = await this.storage.get('homeLocation');
        const homeLatitude = homeLocation.latitude;
        const homeLongitude = homeLocation.longitude;

        const al = 0;
        const bl = 0;
        const cl = 100;
        const am = 50;
        const bm = 250;
        const cm = 500;
        const ah = 300;
        const bh = 1000;
        const ch = 2000;

        return {
            'homeLatitude': homeLatitude,
            'homeLongitude': homeLongitude,
            'al': al, 'bl': bl, 'cl': cl,
            'am': am, 'bm': bm, 'cm': cm,
            'ah': ah, 'bh': bh, 'ch': ch
        };
    }

    async calcualteDistanceScore(hour: number, full = true): Promise<number>{
        const parameters = await this.getParameters();

        const distanceScoreCalculator = new DistanceScore(
            parameters['al'],parameters['bl'],parameters['cl'],
            parameters['am'],parameters['bm'],parameters['cm'],
            parameters['ah'],parameters['bh'],parameters['ch'],
            parameters['homeLatitude'], parameters['homeLongitude']
        );

        let locationsByHour = await this.database.getLocationByHour(hour);
        locationsByHour = full ? locationsByHour : locationsByHour[-1] ? [locationsByHour[-1]] : [];
        const score = distanceScoreCalculator.calculateScore(locationsByHour);
        const meanWifiScore = this.calculateMeanWifiScore(locationsByHour);

        return score.maxScore * meanWifiScore;
    }

    async calculateWifiScore(): Promise<number>{
        const numNetworks = await this.startScan();
        const wifiScore: WifiScore = new WifiScore();
        const homeWifiNetworks = await this.storage.get('homeWifiNetworks');
        const score = wifiScore.get_wifi_score_networks_available(numNetworks, 1.5, homeWifiNetworks);
        return score;
    }

    calculateMeanWifiScore(locationsByHour: Array<any>): number{
        let wifiTotal = 0;
        if(locationsByHour.length !=0){
            for(let wifi_networks of locationsByHour){
                wifiTotal += Number(wifi_networks.wifi_score);
            }
            return wifiTotal/locationsByHour.length;
        }
        return 1;
    }
}
