import { Injectable } from '@angular/core';
import { DatabaseService } from '../../service/database-service';
import { Storage } from '@ionic/storage';
import { WifiScore } from '../../utils_score/wifi_score';
import { DistanceScore } from '../../utils_score/distance_score';
import { APIProvider } from '../api/api';
import {
    BackgroundGeolocation,
    BackgroundGeolocationResponse,
    BackgroundGeolocationEvents,
    BackgroundGeolocationConfig
} from '@ionic-native/background-geolocation';
import { Events } from 'ionic-angular';
import { Encoding, LatLng, ILatLng } from "@ionic-native/google-maps";

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
        public api: APIProvider,
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
            saveBatteryOnBackground: true,
            interval: 300000
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


    calculateExpositionScore(
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

        const distanceScore = await this.calculateDistanceScore(location);
        console.log("distanceScore",distanceScore);
        const wifiScore = await this.calculateWifiScore();
        console.log("wifiScore",wifiScore);
        const timeScore = this.calculateTimeScore();
        console.log("timeScore",timeScore);
        const populationDensityScore = await this.calculatePopulationDensityScore();
        console.log("populationDensityScore",populationDensityScore);
        await this.database.addLocation(location.latitude, location.longitude, location.time, distanceScore.score, distanceScore.distance, timeScore.time, timeScore.score, wifiScore, populationDensityScore);

        this.calculateAndStoreExpositionScores();
    }

    calculateAndStoreExpositionScores() {

        const date = new Date();
        const currentHour = date.getHours();
        this.checkForPendingScores(Number(currentHour));
        //calculate actual score
        this.calculateCompleteScore(Number(currentHour + 1), false).then(score => {
            this.storage.set('partialScore', score.completeScore);
            this.events.publish('scoreChanges', score.completeScore);
        });
        this.api.sendPendingScoresToServer();
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
                        const score = await this.calculateCompleteScore(hour);
                        this.database.saveScore(score.completeScore, hour, score.maxDistanceToHome, score.maxTimeAway, score.encodedRoute);
                        this.database.deleteLocationsByHour(hour);
                    }
                }
            } else{   //there aren't scores yet, calculate all scores until the current hour
                for (let hour = 1; hour < currentHour; hour++) {
                    const score = await this.calculateCompleteScore(hour);
                    this.database.saveScore(score.completeScore, hour, score.maxDistanceToHome, score.maxTimeAway, score.encodedRoute);
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

    async calculateCompleteScore(hour: number, full = true): Promise< {completeScore: number, maxDistanceToHome: number, maxTimeAway: number, encodedRoute: string}>{
        let locationsByHour = await this.database.getLocationByHour(hour);
        const lastElement = locationsByHour[locationsByHour.length - 1];
        locationsByHour = full ? locationsByHour : lastElement ? [lastElement] : [];
        const completeScore = await this.calculateCompleteExposition(locationsByHour);
        const encodedRoute = this.getEncodedRoute(locationsByHour);

        return {completeScore: completeScore.score, maxDistanceToHome: completeScore.maxDistanceToHome, maxTimeAway: completeScore.maxTimeAway, encodedRoute: encodedRoute}

    }

    async calculateWifiScore(): Promise<number>{
        const numNetworks = await this.startScan();
        const wifiScore: WifiScore = new WifiScore();
        const homeWifiNetworks = await this.storage.get('homeWifiNetworks');
        const score = wifiScore.get_wifi_score_networks_available(numNetworks, 1.5, homeWifiNetworks);
        return score;
    }

    async calculateDistanceScore(location): Promise<{score: number, distance: number}>{
        const parameters = await this.getParameters();

        const distanceScoreCalculator = new DistanceScore(
            parameters['al'],parameters['bl'],parameters['cl'],
            parameters['am'],parameters['bm'],parameters['cm'],
            parameters['ah'],parameters['bh'],parameters['ch'],
            parameters['homeLatitude'], parameters['homeLongitude']
        );

        const score = distanceScoreCalculator.calculateScore(location);
        return score;
    }

    calculateTimeScore():{score: number, time: number }{
        //TODO implement
        return {score: 1, time:0};
    }

    async calculateCompleteExposition(locations: any[]): Promise<{score: number, maxDistanceToHome: number, maxTimeAway: number}> {
        var scores: number[] = [];
        var maxDistanceToHome = 0;
        var maxTimeAway = 0;
        var completeScore = Number(await this.storage.get("partialScore")) || 1;

        if(locations !== undefined && locations.length > 0){
            locations.forEach((location) =>{
                scores.push(this.calculateExpositionScore(location.distance_score, location.wifi_score, location.populations_density, location.time_score));
                maxDistanceToHome += location.distance_home;
                maxTimeAway += location.time_away;
            });
            completeScore = Math.max(...scores);
            }
        return {score: completeScore, maxDistanceToHome: maxDistanceToHome, maxTimeAway: maxTimeAway};
    }

    calculateMaxDistanceToHome(scores: Map<any,any>): number{
        const distances = Array.from(scores.values()).map(value => value.distance_home);
        return Math.max(...distances);
    }

    getEncodedRoute(locations : any[]){
        if(locations.length > 0){
            const latLngs: ILatLng[] = locations.map((location) => { return new LatLng(location.latitude, location.longitude); });
            const encodedRoute = Encoding.encodePath(latLngs);
            return encodedRoute;
        }
        return '';
    }

    async calculatePopulationDensityScore(){
        //TODO implement
        return 1;
    }

}
