import { Injectable } from '@angular/core';
import { Platform, DateTime } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';


@Injectable()
export class DatabaseService {

  private database: SQLiteObject;
  private dbReady = new BehaviorSubject<boolean>(false);

  constructor(private platform:Platform, private sqlite: SQLite) {
    this.platform.ready().then(()=>{
      this.sqlite.create({
        name: 'qvid.db',
        location: 'default'
      })
      .then((db:SQLiteObject)=>{
        this.database = db;

        this.createTables().then(()=>{     
          this.dbReady.next(true);
        });
      })

    });
  }

  private createTables(){
    return this.database.executeSql(
      `CREATE TABLE IF NOT EXISTS score (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        score FLOAT,
        hour NUMBER,
        distance_home FLOAT,
        time_away FLOAT,
        encoded_route TEXT,
      );`,{}
    ).then(()=>{
      return this.database.executeSql(
      `CREATE TABLE IF NOT EXISTS location (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude FLOAT,
        longitude FLOAT,
        time INTEGER,
        wifi_score FLOAT,
        status TEXT DEFAULT 'PENDING'
        );`,{})
    }).then(()=>{
      return this.database.executeSql(
      `CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT,
        phone_id STRING,
        home_latitude FLOAT,
        home_longitude FLOAT,
        home_radius FLOAT,
        );`,{})
    }).catch((err)=>console.log("error detected creating tables", err));
  }

  private isReady(){
    return new Promise((resolve, reject) =>{
      //if dbReady is true, resolve
      if(this.dbReady.getValue()){
        resolve();
      }
      //otherwise, wait to resolve until dbReady returns true
      else{
        this.dbReady.subscribe((ready)=>{
          if(ready){ 
            resolve(); 
          }
        });
      }  
    })
  }

  async getScores(){
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql("SELECT * from score", [])
      .then((data)=>{
        let lists = [];
        for(let i=0; i<data.rows.length; i++){
          lists.push(data.rows.item(i));
        }
        return lists;
      })
    })
  }

  async addScore(score: number, hour: number, distanceHome: number, timeAway: number, encodedRoute: String ){
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql(`INSERT INTO score(score,hour,distance_home,time_away,encoded_route) 
      VALUES ('${score}','${hour}','${distanceHome}','${timeAway}','${encodedRoute}');`,{}).then((result)=>{
        if(result.insertId){
          return this.getScore(result.insertId);
        }
      })
    });    
  }
  
  async getScore(id:number){
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql(`SELECT * FROM score WHERE id = ${id}`, [])
      .then((data)=>{
        if(data.rows.length){
          return data.rows.item(0);
        }
        return null;
      })
    })    
  }

  async updateScoreStatus(id: number, status: String){
    return this.isReady()
    .then(()=>{
      return this.database.executeSql(`UPDATE score SET (status) = (${status}) WHERE id = ${id}`, [])
    })
  }

  async deleteScores(){
    return this.isReady()
    .then(()=>{
      return this.database.executeSql(`DELETE FROM score`, [])
    })
  }

  async getLocations(){
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql("SELECT * from score", [])
      .then((data)=>{
        let lists = [];
        for(let i=0; i<data.rows.length; i++){
          lists.push(data.rows.item(i));
        }
        return lists;
      })
    })
  }

  async addLocation(latitude: number, longitude: number, time: number, wifiScore: number){
    // [time] => UTC time of this fix, in milliseconds since January 1, 1970. 
    // convert time to sqlite DATETIME
    var date_time = new Date(time);
    // convert to yyyy-mm-dd hh:mm:ss format
    //let formatted_date = date_time.getFullYear() + "-" + (date_time.getMonth() + 1) + "-" + date_time.getDate() + " " + date_time.getHours() + ":" + date_time.getMinutes() + ":" + date_time.getSeconds();
    var hour = date_time.getHours();
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql(`INSERT INTO location(latitude,longitude,time,wifi_score) 
      VALUES ('${latitude}','${longitude}','${hour}','${wifiScore}');`,{}).then((result)=>{
        if(result.insertId){
          return this.getScore(result.insertId);
        }
      })
    });    
  }
  
  async getLocation(id:number){
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql(`SELECT * FROM location WHERE id = ${id}`, [])
      .then((data)=>{
        if(data.rows.length){
          return data.rows.item(0);
        }
        return null;
      })
    })    
  }

  async deleteLocations(){
    return this.isReady()
    .then(()=>{
      return this.database.executeSql(`DELETE FROM location`, [])
    })
  }

  async getHome(){
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql(`SELECT home_latude, home_longitude, home_radius FROM location`, [])
      .then((data)=>{
        if(data.rows.length){
          return data.rows.item(0);
        }
        return null;
      })
    })    
  }

  async getLocationByHour(hour: number){
    return this.isReady()
    .then(async ()=>{
      return this.database.executeSql(`SELECT * FROM location WHERE time = '${hour-1}'` , [])
      .then((data)=>{
        if(data.rows.length){
          return data.rows;
        }
        return null;
      })
    })   
  }

}
