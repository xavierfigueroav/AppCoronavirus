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
    color0: string;
    color1: string;
    color2: string;
    color3: string;

	constructor(public navCtrl: NavController, public navParams: NavParams, public appCtrl: App, private storage: Storage) {
    }

    ngOnInit() {
        this.counter = 0.0;
        console.log('ionViewDidLoad UserPage');
        setInterval(() => {
            this.color0 = this.changeColor(this.counter);
            this.color1 = this.changeColor((this.counter + 0.3) % 1);
            this.color2 = this.changeColor((this.counter + 0.6) % 1);
            this.color3 = this.changeColor((this.counter + 0.9) % 1);
            this.counter = (this.counter + 0.01) % 1;
        }, 125);

    }

    changeColor(score: number) {
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
