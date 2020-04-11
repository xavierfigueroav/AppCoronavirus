import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationResponse, BackgroundGeolocationEvents, BackgroundGeolocationConfig } from '@ionic-native/background-geolocation';
import { DatabaseService } from '../../service/database-service';
import { Storage } from '@ionic/storage';
import { MyApp } from '../../app/app.component';
import { WifiScore } from '../../utils_score/wifi_score';
import { DistanceScore } from '../../utils_score/distance_score';

declare var WifiWizard2: any;

/*
  Generated class for the ScoreProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ScoreProvider {

    static counter = 0;

  constructor(
    private storage: Storage,
    private backgroundGeolocation: BackgroundGeolocation,
    public database:DatabaseService
    ) {
    console.log('Hello ScoreProvider Provider');
    this.startBackgroundGeolocation();
  }

  async checkForParameters() {

    const homeLocation = await this.storage.get('homeLocation');
    // TODO: Replace this with this.storage.get('homeRadius');
    const homeRadius = 1;

    console.log('homeLocation', homeLocation);

    if(homeLocation !== null && homeRadius !== null) {
        console.log('startBackgroundGeolocation');
        this.startBackgroundGeolocation();
    }
}

  async startScan(): Promise<number> {
    var num_networks;
    if (typeof WifiWizard2 !== 'undefined') {
            console.log("WifiWizard2 loaded: ");
            console.log(WifiWizard2);
    } else {
        console.warn('WifiWizard2 not loaded.');
    }
    await WifiWizard2.scan().then(function(results){
        console.log("Inside Scan function");
        for (let x of results) {
            var level = x["level"];
            var ssid = x["SSID"];
            var bssid = x["BSSID"];
            var frequency = x["frequency"];
            var capabilities = x["capabilities"];
            var timestamp = x["timestamp"];
            console.log("Level: "+level+", SSID: "+ssid+", BSSID: "+bssid+"\n"
                        +"Frequency: "+frequency+", Capabilities: "+capabilities+"\n"
                        +"Timestamp: "+timestamp);
        }
        num_networks = results.length;
    }).catch((error) => {console.log('ERROR SCAN', JSON.stringify(error))});
    return num_networks;
}


calculate_exposition_score(distance_score, wifi_score=1, density_score=1, time_score=1,
                            alpha=0.33, beta=0.33, theta=0.33): number{ //time given in minutes
    var score = distance_score * ((alpha*wifi_score) + (beta*density_score) + (theta*time_score));
    return Number(score.toFixed(2));
}

startBackgroundGeolocation() {
    const config: BackgroundGeolocationConfig = {
        desiredAccuracy: 10,
          stationaryRadius: 1,
          distanceFilter: 1,
          debug: true,
          stopOnTerminate: false
    };

    this.backgroundGeolocation.configure(config).then(() => {
        console.log('Background geolocation => configured');
        this.backgroundGeolocation
            .on(BackgroundGeolocationEvents.location)
            .subscribe((location: BackgroundGeolocationResponse) => {
                console.log('ssssssss');
                this.locationHandler(location);
            });
    });
    // start recording location
    this.backgroundGeolocation.start();
    console.log('Background geolocation => started');
}

async locationHandler(location: BackgroundGeolocationResponse){
    console.log('Background geolocation => location received');

    var wifiScore = await this.calculateWifiScore();
    this.database.addLocation(location.latitude, location.longitude, location.time, wifiScore);

    var date = new Date();
    var currentHour = date.getHours();
    this.checkForPendingScores(Number(currentHour));

    this.calculatePartialActualScore(Number(currentHour)); //this value will be graficated in actual score

    this.sendPendingScoresToServer();

    this.database.getLocations().then(locations => {
        console.log('locations handler: ', locations);
    });
}

// Calculate and save the scores only for complete hours
checkForPendingScores(currentHour: number){
    if(currentHour == 0) currentHour = 24;
    this.database.getScores().then(async (data:any) =>{
      if(data){
        var lastScoreHour = data.length;
        console.log('lastscorehour', lastScoreHour);
        console.log('currentscore', currentHour);
        if(lastScoreHour > currentHour){ //  if we are in different days, delete previous scores and check again
            this.database.deleteScores();
            this.checkForPendingScores(currentHour);
        }else{                          // if we are in the same day, only calculate the score from the last score hour to the current hour
            for (let hour = lastScoreHour+1; hour < currentHour; hour++) {
                var score = await this.calcualteDistanceScore(hour);
                this.database.addScore(score, hour, 0, 0, "");
                console.log('');
            }
        }
      }else{   //there aren't scores yet, calculate all scores until the current hour
      console.log('no scores yet');
        for (let hour = 1; hour < currentHour; hour++) {
            var score = await this.calcualteDistanceScore(hour);
            this.database.addScore(score, hour, 0, 0, "");
        }
      }
    })
}

async getParameters() : Promise<{}>{
    var parameters = {};
    var homeLocation = await this.storage.get("homeLocation");
    var homeLatitude = homeLocation["latitude"];
    var homeLongitude = homeLocation["longitude"];

    var al = 0;
    var bl = 0;
    var cl = 100;
    var am = 50;
    var bm = 250;
    var cm = 500;
    var ah = 300;
    var bh = 1000;
    var ch = 2000;

    parameters = {"homeLatitude":homeLatitude,"homeLongitude":homeLongitude,
                  "al":al,"bl":bl,"cl":cl,
                  "am":am,"bm":bm,"cm":cm,
                  "ah":ah,"bh":bh,"ch":ch}
    return parameters;
}

async calcualteDistanceScore(hour: number): Promise<number>{
    var parameters = await this.getParameters();
    var distanceScoreCalculator = new DistanceScore(parameters["al"],parameters["bl"],parameters["cl"],
                                                    parameters["am"],parameters["bm"],parameters["cm"],
                                                    parameters["ah"],parameters["bh"],parameters["ch"],
                                                    parameters["homeLatitude"], parameters["homeLongitude"]);
    var locationsByHour = await this.database.getLocationByHour(hour);
    console.log('locationbyhour', locationsByHour, hour);
    var score = distanceScoreCalculator.calculateScore(locationsByHour);
    var meanWifiScore = this.calculateMeanWifiScore(locationsByHour);
    return score.maxScore * meanWifiScore;
}

async calculatePartialActualScore(hour: number): Promise<number>{
    var parameters = await this.getParameters();
    var distanceScoreCalculator = new DistanceScore(parameters["al"],parameters["bl"],parameters["cl"],
                                                    parameters["am"],parameters["bm"],parameters["cm"],
                                                    parameters["ah"],parameters["bh"],parameters["ch"],
                                                    parameters["homeLatitude"], parameters["homeLongitude"]);
    var locationsByHour = await this.database.getLocationByHour(hour + 1); //Database return the previous hour score
    var score = distanceScoreCalculator.calculateScore(locationsByHour);
    this.storage.set("partialScore",score.maxScore);
    return score.maxScore;
}

async calculateWifiScore(): Promise<number>{
    var numNetworks = await this.startScan();
    var wifiScore: WifiScore = new WifiScore();
    var homeWifiNetworks = await this.storage.get('homeWifiNetworks');
    var score = wifiScore.get_wifi_score_networks_available(numNetworks, 1.5, homeWifiNetworks);
    return score;
}

sendPendingScoresToServer(){
    // TODO sent scores to CKAN
}

calculateMeanWifiScore(locationsByHour: Array<any>): number{
    var wifiTotal = 0;
    if(locationsByHour.length !=0){
        for(let wifi_networks of locationsByHour){
            wifiTotal += Number(wifi_networks.wifi_score);
        }
        return wifiTotal/locationsByHour.length;
    }
    return 1;
}

}
