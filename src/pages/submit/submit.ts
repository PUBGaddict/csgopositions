import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { DefusalData } from '../../providers/defusal-data';
import { HostageData } from '../../providers/hostage-data';
import { SpotIdData } from '../../providers/spotid-data';
import { Http } from '@angular/http';
import { YoutubePlayerComponent } from '../../app/youtube-player.component';
import { MapOverviewComponent } from '../../app/map-overview.component';

import { FirebaseApp } from 'angularfire2';
import 'firebase/storage';

/*
  Generated class for the Submit page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-submit',
  templateUrl: 'submit.html'
})
export class SubmitPage {
  @ViewChild('youtubePlayer') youtubePlayer: YoutubePlayerComponent;
  @ViewChild('mapOverview') mapOverview: MapOverviewComponent;

  de_maps: any[] = [];
  cs_maps: any[] = [];

  firstPress: any = null; 
  secondPress: any = null;

  private isFirstPress : boolean = true;
  public storageRef : any = null;
  public saveButtonDisabled : boolean = false;
  public videoId: string = "Dc6wTKOvpDk";
  public category: string = "";
  public title: string = "";
  public map: string = "";
  public startSeconds: number = 0;
  public endSeconds: number = 15;
  public start :any =  {
    x : 0,
    y : 0
  };
  public end : any = {
    x : 0,
    y : 0
  }

  constructor(public navCtrl: NavController, public navParams: NavParams, public defusalData: DefusalData, public hostageData: HostageData, public firebaseApp : FirebaseApp, public toastCtrl: ToastController, public http: Http, public spotIdData : SpotIdData) {
    this.defusalData.getDefusalMaps().subscribe((de_maps: any[]) => {
      this.de_maps = de_maps;
    });
    this.hostageData.getHostageMaps().subscribe((cs_maps: any[]) => {
      this.cs_maps = cs_maps;
    });
  }

  refresh() {
    this.youtubePlayer.play({
      videoId : this.videoId,
      startSeconds: this.startSeconds,
      endSeconds: this.endSeconds,
    });
  }

  logPress(event) {
    console.log(event);

    if (this.isFirstPress) {
      this.start = event;
      this.mapOverview.appendDataSpots([{
        angle : 0,
        start : {
          x : event.x,
          y : event.y
        },
        end : {
          x : 0,
          y : 0
        }
      }]);
      this.isFirstPress = false;
      
      if (this.category !== 'smoke') {
        this.isFirstPress = true;  
      }
    } else {
      this.mapOverview.appendDataSpots([{
        angle : 0,
        start : {
          x : this.start.x,
          y : this.start.y
        },
        end : {
          x : event.x,
          y : event.y
        }
      }]);
      this.end = event;
      this.isFirstPress = true;
    }
  }

  ionViewDidLoad() {
    ga('set', 'page', '/submit');
    ga('send', 'event', "page", "visit", "submit");

    console.log('ionViewDidLoad SubmitPage');
  }

  savePressed () {
    this.saveButtonDisabled = true;
    let oSpot = {
      videoId : this.videoId,
      strategy : this.category,
      mapname : this.map,
      title : this.title,
      startSeconds : this.startSeconds,
      endSeconds : this.endSeconds,
      start : this.start,
      end: this.end
    };
    this.spotIdData.submitSpot(oSpot).subscribe((spot: any) => {
      this.presentToast();
    })
  }

  mapChanged () {
    this.isFirstPress = true;
    this.mapOverview.clearDataSpots();
    this.mapOverview.setMap(this.map);
    this.mapOverview.displayMap(false);
  }

  categoryChanged () {
    this.isFirstPress = true;
    this.mapOverview.clearDataSpots();
  }

  presentToast() {
    let toast = this.toastCtrl.create({
      message: 'Spot successfully created. Lean back while we verify your great spot!',
      duration: 7000
    });
    toast.present();
  }

}
