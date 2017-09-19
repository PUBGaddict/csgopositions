import { Injectable } from '@angular/core';
import { firebaseConfig } from '../app/app.module';

import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { CategoryData } from '../providers/category-data';
import { AngularFireDatabase, FirebaseObjectObservable } from 'angularfire2/database';



@Injectable()
export class SpotData {
  private mapCache: any = {};
  private spotCacheSingle: any = {};
  private spotCacheQuery: any = {};
  private spotCacheShallowKeys: any = [];
  private lastKey = "";
  private lastValue = "";

  public afRatingRef: FirebaseObjectObservable<any>;

  constructor(public http: Http, public categoryData: CategoryData, public angularFireDatabase: AngularFireDatabase) { }

  private loadSpot(spotId: string): Observable<any> {
    if (spotId in this.spotCacheSingle) {
      console.log("loading single from cache");
      return Observable.of(this.spotCacheSingle[spotId]);
    } else {
      return this.http.get(firebaseConfig.databaseURL + '/fspots/'
        + spotId + '.json')
        .map((data) => {
          let spot = data.json();
          this.spotCacheSingle[spotId] = spot;
          return spot || {};
        });
    }
  }

  public getSpot(spotId: string) {
    return this.loadSpot(spotId);
  }

  private loadSpots(path: string): Observable<any> {
    if (path in this.spotCacheQuery) {
      console.log("loading query from cache");
      return Observable.of(this.spotCacheQuery[path]);
    } else {
      return this.http.get(firebaseConfig.databaseURL + '/fspots.json?orderBy="path"&equalTo="'
        + path + '"')
        .map((rawData) => {
          let data = rawData.json(),
            spots = [];
          for (let key in data) {
            if (data.hasOwnProperty(key)) {
              spots.push(data[key]);
            }
          }
          this.spotCacheQuery[path] = spots;
          Object.assign(this.spotCacheSingle, spots);
          return spots;
        });
    }
  }

  public getSpots(category) {
    return this.loadSpots(category);
  }

  public getUnpublishedSpots() {
    return this.loadSpots("unpublished");
  }

  public getNextSpot(category: string, spotId: string) {
    const queryObservable = this.angularFireDatabase.list('/fspots', {
      query: {
        orderByChild: 'path',
        startAt: { value: category, key: spotId },
        limitToFirst: 2
      }
    });

    return queryObservable.map(spots => {
      return spots[1];
    });
  }

  public getPreviousSpot(category: string, spotId: string) {
    const queryObservable = this.angularFireDatabase.list('/fspots', {
      query: {
        orderByChild: 'path',
        endAt: { value: category, key: spotId },
        limitToLast: 2
      }
    });

    return queryObservable.map(spots => {
      return spots[0];
    });
  }

  getSpotsForTag(category: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(`${firebaseConfig.databaseURL}/menu/${category}/spots.json?shallow=true`).toPromise()
        .then((rawData) => {
          let data = rawData.json(),
            promises = [];

          if (Object.keys(data).length === 0 && data.constructor === Object) {
            reject("category is empty");
          }

          for (let key in data) {
            promises.push(this.loadSpot(key).toPromise())
          }
          Promise.all(promises).then((params) => {
            resolve(params);
          });
        });
    })
  }

  public getInitialTagsForCategory(category : string, orderBy: string) : Promise<any> {
    return new Promise((resolve, reject) => {
      let query = {
        orderByChild: `key/${orderBy}`
      };
      query[orderBy === 'ratings' ? 'limitToFirst' : 'limitToLast'] = 5;

      let obs = this.angularFireDatabase.list(`/menu/${category}/spots`, {
        query: query 
      }).subscribe((data : any) => {
          let  promises = [],
            sortProperty = orderBy === 'ratings' ? 'rating' : 'date';
          
          data.sort((b,a) => { 
            if(a[sortProperty] < b[sortProperty]) return -1;
            if(a[sortProperty] > b[sortProperty]) return 1;
            return 0;
          })

          this.lastKey = data[data.length - 1]['$key'];
          this.lastValue = data[data.length - 1][orderBy === 'ratings' ? 'rating' : 'date']

          for (let key in data) {
            promises.push(this.loadSpot(data[key].$key).toPromise())
          }
          Promise.all(promises).then((params) => {
            obs.unsubscribe();
            resolve(params);
          });
        })
      });
  }

  public getNextTagsForCategory(category : string, orderBy: string) : Promise<any> {
    return new Promise((resolve, reject) => {
      let query = {
        orderByChild: 'rating',
        endAt: { value : this.lastValue, key: this.lastKey },        
        limitToLast : 5
      };
      //query[orderBy === 'ratings' ? 'limitToFirst' : 'limitToLast'] = 5;

      let obs = this.angularFireDatabase.list(`/menu/${category}/spots/$key/`, {
        query: query 
      }).subscribe((data : any) => {
          let  promises = [],
            sortProperty = orderBy === 'ratings' ? 'rating' : 'date';
            
          data.sort((b,a) => { 
            if(a[sortProperty] < b[sortProperty]) return -1;
            if(a[sortProperty] > b[sortProperty]) return 1;
            return 0;
          })
          console.log(data);
          debugger;
          this.lastKey = data[data.length - 1]['$key'];

          for (let key in data) {
            promises.push(this.loadSpot(data[key].$key).toPromise())
          }
          Promise.all(promises).then((params) => {
            obs.unsubscribe();
            resolve(params);
          });
        })
      });
  }


  public getRandomSpot(): Promise<any> {
    return new Promise((resolve, reject) => {

      // is shallow list cached?
      if (this.spotCacheShallowKeys.length > 0) {
        console.log("getting random spot from shallow cache");
        let randomIndex = Math.floor(Math.random() * this.spotCacheShallowKeys.length);
        let key = this.spotCacheShallowKeys[randomIndex];
        this.getSpot(key).toPromise().then(spot => {
          if (!!spot.published) {
            resolve(spot);
          } else {
            resolve(this.getRandomSpot());
          }
        });


      // no cache
      } else {
        this.http.get(firebaseConfig.databaseURL + '/fspots.json?shallow=true')
          .map(data => {
            this.spotCacheShallowKeys = Object.keys(data.json());
            let keys = this.spotCacheShallowKeys;
            let randomIndex = Math.floor(Math.random() * keys.length);
            return keys[randomIndex];
          }).toPromise().then(key => {
            this.getSpot(key).toPromise().then(spot => {
              if (!!spot.published) {
                resolve(spot);
              } else {
                resolve(this.getRandomSpot());
              }
            });
          });
      }
    });
  }
}
