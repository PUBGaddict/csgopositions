import { Injectable } from '@angular/core';
import { firebaseConfig } from '../app/app.module';

import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';


@Injectable()
export class CategoryData {

  currentLowestValue : number = 0;
  categorySet = {};
  allCategories : Array<any> = [];

  constructor(public http: Http) { }

  private loadCategories(): any {
      return this.http.get(firebaseConfig.databaseURL + '/menu.json')
        .map(data => {
          let jsonData = data.json(),
              categories = [];
          for (let key in jsonData) {
            if(jsonData.hasOwnProperty(key)) {
              categories.push({category : key, amount : jsonData[key]});
            }
          }
          return categories;
        });
  }

  getCategories() {
    return this.loadCategories();
  }

  loadMenuItems(startAt: number) : Promise<any> {
    return this.http.get(`${firebaseConfig.databaseURL}/menu.json?orderBy="$value"&startAt=${startAt}&limitToLast=10`)
    .map(items => {
      return items.json();
    }).toPromise();
  }

  private sortAndFindLowest(categorySet) {
    let arr = [];
    for (let key in categorySet) {
      if (this.currentLowestValue === 0) {
        this.currentLowestValue = this.categorySet[key];
      }
      if (categorySet[key] < this.currentLowestValue) {
        this.currentLowestValue = categorySet[key];          
      }
      arr.push({category : key, amount : categorySet[key]})
    }
    arr.sort((a,b) : any => {
      return a.amount < b.amount;
    });
    return arr;
  }

  getInitialCategories() : Promise<any> {
    return this.http.get(`${firebaseConfig.databaseURL}/menu.json?orderBy="$value"&limitToLast=50`)
    .map(rawItems => {
      let categorySet = rawItems.json();
      let arr = [];
      for (let key in categorySet) {
        if (this.currentLowestValue === 0) {
          this.currentLowestValue = this.categorySet[key];
        }
        if (categorySet[key] < this.currentLowestValue) {
          this.currentLowestValue = categorySet[key];          
        }
        arr.push({category : key, amount : categorySet[key]})
      }
      arr.sort((a,b) : any => {
        return a.amount < b.amount;
      });
      debugger;
      return arr;
    }).toPromise();
  }
  getCategoriesWithLessSpotsThan (number : number) {
    // return new Promise((resolve, reject) => {
    //   if (!number || number < 0) {
    //     reject("no older patchnotes found");
    //   }
  
      // return this.http.get(firebaseConfig.databaseURL + '/menu.json')
      //   .ref('n/p/' + number + '.json')
      //   .getDownloadURL()
      //   .then(url => {
      //     resolve(this.downloadUrlContent(url));
      //   })
    // })
  }
}
