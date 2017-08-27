import { Injectable } from '@angular/core';
import { firebaseConfig } from '../app/app.module';

import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';


@Injectable()
export class DefusalData {

  constructor(public http: Http) { }

  private loadDefusalMaps(): any {
<<<<<<< HEAD
      return this.http.get('https://pubgaddicts-b4ff7.firebaseio.com/menu.json')
=======
      return this.http.get(firebaseConfig.databaseURL + '/menu.json')
>>>>>>> 3ac2f4a360462757b770f6577895961bde3541c1
        .map(data => {
          let jsonData = data.json(),
              deMaps = [];
          for (let key in jsonData) {
            if(jsonData.hasOwnProperty(key)) {
              let amount = 0;
              for (let child in jsonData[key]) {                  
                  amount += jsonData[key][child];                  
              }
              deMaps.push({mapname : key, amount : amount});
            }
          }
          return deMaps;
        });
  }

  getDefusalMaps() {
    return this.loadDefusalMaps();
  }
}
