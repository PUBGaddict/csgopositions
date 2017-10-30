import { Injectable } from '@angular/core';
import { firebaseConfig } from '../app/app.module';

import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { CategoryData } from '../providers/category-data';
import { AngularFireDatabase } from 'angularfire2/database';

import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';

@Injectable()
export class SpotData {
  private mapCache: any = {};
  private spotCacheSingle: any = {};
  private spotCacheQuery: any = {};
  private spotCacheShallowKeys: any = [];
  private lastKey = "";
  private lastValue = "";

  constructor(public http: Http, public categoryData: CategoryData, public angularFireDatabase: AngularFireDatabase, public fireStore : AngularFirestore) { }

  private loadSpot(spotId: string): Observable<any> {
    if (spotId in this.spotCacheSingle) {
      console.log("loading single from cache");
      return Observable.of(this.spotCacheSingle[spotId]);
    } else {
      return this.fireStore.doc(`fspots/${spotId}`).valueChanges().map((spot : any) => {
        this.spotCacheSingle[spotId] = spot;
        return spot;
      });
    }
  }

  public getSpot(spotId: string) : Observable<any> {
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

  public getUnpublishedSpots() {
    return this.loadSpots("unpublished");
  }

  public getNextSpot(category: string, spotId: string) :Observable<any>{  
    const queryObservable = this.angularFireDatabase.list('/fspots',
    ref => ref.orderByChild('path').startAt(category, spotId).limitToFirst(2));

    return queryObservable.valueChanges().map(spots => {
      return spots[1];
    });
  }

  public getPreviousSpot(category: string, spotId: string) {
    const queryObservable = this.angularFireDatabase.list('/fspots', 
    ref => ref.orderByChild('path').endAt(category, spotId).limitToLast(2));

    return queryObservable.valueChanges().map(spots => {
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
            promises.push(this.loadSpot(key))
          }
          Promise.all(promises).then((params) => {
            resolve(params);
          });
        });
    })
  }

  public getNextTagsForCategory(category: string, sortProperty: string, bReset: boolean): Promise<any> {
    let maxValue = 99999999999999;
    if (bReset) {
      this.lastKey = "";
      this.lastValue = "";
    }
    let endAt = !!this.lastKey ? { value: this.lastValue, key: this.lastKey } : maxValue;

    let queryObservable = this.angularFireDatabase.list(`/menu/${category}/spots`, 
    ref => ref.orderByChild(sortProperty).endAt(endAt.toString()).limitToFirst(4))
    .valueChanges()
    .map((data: any) => {
      if (!!this.lastKey && data.length <= 1) {
        return [];
      }

      if (!!this.lastKey) {
        data = data.slice(0, data.length - 1);
      }
      this.lastKey = data[0]['$key'];
      this.lastValue = data[0][sortProperty];

      data.sort((b, a) => {
        if (a[sortProperty] < b[sortProperty]) return -1;
        if (a[sortProperty] > b[sortProperty]) return 1;
        return 0;
      });
      return data;
    });

    return new Promise((resolve, reject) => {
      let subscription = queryObservable
        .subscribe(data => {
          let promises = [];
          for (let key in data) {
            promises.push(this.loadSpot(data[key].$key))
          }
          Promise.all(promises).then((params) => {
            subscription.unsubscribe();
            resolve(params);
          });
        });
    });
  }


  public getRandomSpot(): Promise<any> {
    return new Promise((resolve, reject) => {

      // is shallow list cached?
      if (this.spotCacheShallowKeys.length > 0) {
        console.log("getting random spot from shallow cache");
        let randomIndex = Math.floor(Math.random() * this.spotCacheShallowKeys.length);
        let key = this.spotCacheShallowKeys[randomIndex];
        this.getSpot(key).subscribe(spot => {
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
            this.getSpot(key).subscribe(spot => {
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
