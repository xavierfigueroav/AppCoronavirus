
export class DistanceScore {

    private al: number;
    private bl: number;
    private cl: number;
    private am: number;
    private bm: number;
    private cm: number;
    private ah: number;
    private bh: number;
    private ch: number;
    private homeLat: number;
    private homeLong: number;

    constructor(al: number,
      bl: number,
      cl: number,
      am: number,
      bm: number,
      cm: number,
      ah: number,
      bh: number,
      ch: number,
      homeLat: number,
      homeLong: number
    ){
      this.al = al;
      this.bl = bl;
      this.cl = cl;
      this.am = am;
      this.bm = bm;
      this.cm = cm;
      this.ah = ah;
      this.bh = bh;
      this.ch = ch;
      this.homeLat = homeLat,
      this.homeLong = homeLong
    };

    calculateScore(locations: any[]): {maxScore: number, meanMax: number}{
        var max: {value:number} = {value : null};
        var Home: Point = new Point(this.homeLat, this.homeLong, 0, 0);
        if(locations.length > 0){
          var scoreData = new ScoreData(locations);
          scoreData.getDistancesToRef(Home);
          scoreData.setLow(this.al, this.bl, this.cl);
          scoreData.setMid(this.am, this.bm, this.cm);
          scoreData.setMax(this.ah, this.bh, this.ch);
          var sumScore: number = 0;
          var sumMax: number = 0;
          var score: number;
          scoreData.points.forEach(function(point){
            score = scoreData.scoreExposure(point.distH, max);
            sumMax += max.value;
            sumScore += score;
          });
          return {maxScore: Math.round(sumScore/scoreData.points.length), meanMax: sumMax/scoreData.points.length};
        }else{
          return {maxScore: 1, meanMax: 0}
        }
    }
}


class Point {
    public x: number;
    public y: number;
    public distH: number
    public ptsCnt: number;
    public cluster: number;

    constructor (x: number,y: number,distH: number,ptsCnt: number){
      this.x = x;
      this.y = y;
      this.distH = distH;
      this.ptsCnt = ptsCnt;
    }

    getDis(ot: Point): number {
      return this.distance(this.x, this.y, ot.x, ot.y);
    }

    distance(lat1: number, lon1: number, lat2: number, lon2: number): number{
        var theta: number, dist: number;
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        } else {
            theta = lon1 - lon2;
            dist = Math.sin(this.deg2rad(lat1)) * Math.sin(this.deg2rad(lat2)) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.cos(this.deg2rad(theta));
            dist = Math.acos(dist);
            dist = this.rad2deg(dist);
            dist = dist * 60 * 1.1515;
            dist = dist * 1.609344;
        }
        return dist;
    }

    deg2rad(deg: number): number {
        return (deg * Math.PI / 180);
    }

    rad2deg(rad: number): number {
        return (rad * 180 / Math.PI);
    }

  };

  class ScoreData {

    public points: Array<Point>;
    private al: number;
    private bl: number;
    private cl: number;
    private am: number;
    private bm: number;
    private cm: number;
    private ah: number;
    private bh: number;
    private ch: number;

    constructor(locations: any[]) {

      this.points = new Array();
      locations.forEach((location: any) => {
        this.points.push(new Point(location.latitude, location.longitude, 0,0))
      });

    }

    getPoints(): Array<Point> { //esta de más
        return this.points;
    }

    getDistancesToRef(H: Point) {
      this.points.forEach(function (point) {
        point.distH = H.getDis(point);
      });
    }

    printDisdH(){
      this.points.forEach(function (point) {
        console.log(Math.round(point.distH*100000)/100000);
      });
    }

    setLow(a: number, b: number, c: number){
      this.al=a; this.bl=b; this.cl=c;
    }

    setMid(a: number, b: number, c: number){
      this.am=a; this.bm=b; this.cm=c;
    }

    setMax(a: number, b: number, c: number){
      this.ah=a;  this.bh=b; this.ch=c;
    }

    computeMean(): number {
      var sum: number =0;
      this.points.forEach(function (point) {
        sum+=point.distH;
      });
      return sum / this.points.length;
    }

    stdev(mean: number): number  {
      var variance: number = 0;
      this.points.forEach(function (point) {
        variance = variance + Math.pow(point.distH - mean, 2);

      });
      console.log(Math.sqrt(variance / this.points.length))     ;
      return Math.sqrt(variance / this.points.length);
    }

    trimf(x: number, a: number, b: number, c: number): number{ // menor que a -> cero, b posicion de pico, mayor que c ->cero
        return (Math.max(Math.min( (x-a)/(b-a),(c-x)/(c-b) ),0));
    }

    lowExposure(x: number): number{
      return (this.trimf(x, this.al, this.bl, this.cl));
    }

    mediumExposure(x: number): number{
      return (this.trimf(x, this.am, this.bm, this.cm));
    }

    highExposure(x: number): number{
      return (this.trimf(x, this.ah, this.bh, this.ch));
    }

    scoreExposure(x: number, max:{value: number} ): number{
        var low: number;
        var mid: number;
        var high: number;

        low= this.lowExposure(x);
        mid= this.mediumExposure(x);
        high= this.highExposure(x);
        max.value= Math.max(high, Math.max(mid,low));
        if(max.value==low)	return (1);
        if(max.value==mid)	return (2);
        if(max.value==high)	return (3);
        return 0;
    }

};
