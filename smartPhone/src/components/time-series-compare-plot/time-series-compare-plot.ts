import { Component, ViewChild, OnInit, OnChanges, AfterViewInit, ElementRef, Input } from '@angular/core';

import { Chart } from 'chart.js';

/**
 * Generated class for the TimeSeriesComparePlotComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'time-series-compare-plot',
  templateUrl: 'time-series-compare-plot.html'
})
export class TimeSeriesComparePlotComponent implements OnChanges {

  @ViewChild('canvas') canvas: ElementRef;
  @Input() data: any[];
  @Input() place1: string;
  @Input() place2: string;
  @Input() parameter1: string;
  @Input() parameter2: string;
  chart: Chart;

  constructor() {
    console.log('Hello TimeSeriesComparePlotComponent Component');
  }

  ngOnChanges() {
      console.log('change-ts');
      if (this.canvas !== undefined) {
          console.log('hay canvas');
          this.generateGraph();
      }
  }

  transform(parameter: string, area: string) {

      const transformed = [];

      this.data.forEach(measure => {
          if ((area === 'NACIONAL' && measure['CANTON'] === measure['PROVINCIA']) ||
              (measure['CANTON'] === area || measure['PROVINCIA'] === area)) {

            transformed.push({x: measure['FECHA']* 1000, y: measure[parameter]});
          }

      });
      return transformed;
  }

  async generateGraph() {
      console.log('ts');

      let chartData1: any[];
      let chartData2: any[];

      const fixedPlace = this.place1 === this.place2;

      chartData1 = this.transform(this.parameter1, this.place1);
      chartData2 = this.transform(this.parameter2, this.place2);

      this.chart = new Chart(this.canvas.nativeElement, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: fixedPlace ? this.parameter1 : this.place1,
                    data: chartData1,
                    fill: false,
                    borderColor: 'RGBA(219, 68, 55, 1)',
                    backgroundColor: 'RGBA(219, 68, 55, 1)'
                },
                {
                    label: fixedPlace ? this.parameter2 : this.place2,
                    data: chartData2,
                    fill: false,
                    borderColor: 'RGBA(15, 157, 88, 1)',
                    backgroundColor: 'RGBA(15, 157, 88, 1)'
                }
            ]
        },
        options: {
            scales: {
                xAxes: [{ type: 'time' }]
            },
            legend: { position: 'bottom' }
        }
    });
  }

}
