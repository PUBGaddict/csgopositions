import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CategoryData } from '../../providers/category-data';
import { SpotIdData } from '../../providers/spotid-data';
import { Http } from '@angular/http';
import { YoutubePlayerComponent } from '../../app/youtube-player.component';

import { EndSecondsValidator } from  '../../validators/endSeconds';
import { StartSecondsValidator } from  '../../validators/startSeconds';
import { PictureValidator } from  '../../validators/picture';
import { AdditionalPictureValidator } from  '../../validators/additionalPicture';

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
  @ViewChild('progress') progress;
  @ViewChild('spotDetails') spotDetails;

  tags = ['Ionic', 'Angular', 'TypeScript'];  

  private submitAttempt: boolean = false;
  public detailsInvisible: boolean = true;

  public saveButtonDisabled : boolean = false;

  public spotHeadForm : any;
  public youtubeDetailForm : any;
  public gfycatDetailForm : any;

  constructor(public navCtrl: NavController, public categoryData : CategoryData, public navParams: NavParams, public toastCtrl: ToastController, public http: Http, public spotIdData : SpotIdData, public formBuilder: FormBuilder) {
    // validators
    this.spotHeadForm = formBuilder.group({
        title: ['', Validators.compose([Validators.required, Validators.maxLength(50), Validators.minLength(10), Validators.pattern('[a-zA-Z,. ]*')])],
        strategy: ['', Validators.compose([Validators.required])],
        tags: [[]]
    });

    this.youtubeDetailForm = formBuilder.group({
        startSeconds: ['', Validators.compose([Validators.required, Validators.min(0), Validators.pattern('[0-9]*')])],
        endSeconds: ['', Validators.compose([Validators.required, Validators.min(0), Validators.pattern('[0-9]*')])],
        videoId: ['', Validators.compose([Validators.required, Validators.maxLength(11), Validators.minLength(11), Validators.pattern('[0-9a-zA-Z_-]*')])]
    });

    this.gfycatDetailForm = formBuilder.group({
        angle: ['', Validators.compose([Validators.required, Validators.max(360), Validators.min(0)])],
        picture_1: ['', Validators.compose([Validators.required, PictureValidator.isValid])],
        picture_2: ['', AdditionalPictureValidator.isValid],
        picture_3: ['', AdditionalPictureValidator.isValid]
    });
  }

  onChangeTag(val){
    console.log(this.spotHeadForm.get('tags').value)
  }

  isYoutube () {
    return this.spotHeadForm.get('strategy').value === 'youtube';
  }

  isGfycat () {
    return this.spotHeadForm.get('strategy').value === 'gfycat';
  }

  onVideoIdChanged(event) {
    let url :string = event.value;
    let videoId :string = "";
    if (url.startsWith("https://www.youtube.com/watch")) {
      if (url.includes("?v=")) {
        videoId = url.substr(url.indexOf("?v=") + 3, 11);
      }
      if (url.includes("&v=")) {
        videoId = url.substr(url.indexOf("&v=") + 3, 11);
      }
      this.youtubeDetailForm.get('videoId').setValue(videoId);
    }
    this.refresh();
  }
 
  refresh() {
    if (!this.youtubeDetailForm.valid) {
      return;
    }

    this.youtubePlayer.play({
      videoId : this.youtubeDetailForm.get('videoId').value,
      startSeconds: this.youtubeDetailForm.get('startSeconds').value,
      endSeconds: this.youtubeDetailForm.get('endSeconds').value,
    });
  }

  logPress(event) {
    console.log(event);
    let strategy = this.spotHeadForm.get('strategy').value;
  }

  ionViewDidLoad() {
    ga('set', 'page', '/submit');
    ga('send', 'event', "page", "visit", "submit");

    console.log('ionViewDidLoad SubmitPage');
  }

  savePressed () {
    if (!this.spotHeadForm.valid) {
      this.presentToast('Please fill out all the mandatory fields so we can process your great spot!');
      this.submitAttempt = true;
      return;
    }
    let strategy = this.spotHeadForm.get('strategy').value,
        title = this.spotHeadForm.get('title').value,
        tags = this.spotHeadForm.get('tags').value;

    // if the user has selected youtube or gfycat, the youtubeDetailForm needs to be valid
    if ((strategy === 'youtube' || strategy === 'gfycat') && !this.youtubeDetailForm.valid) {
      this.presentToast('Please fill out all the mandatory fields so we can process your great spot!');
      return;
    }
    // if the user has selected youtube, and endSeconds < startSeconds 
    if ((strategy === 'youtube') && parseInt(this.youtubeDetailForm.get('endSeconds').value, 10) < parseInt(this.youtubeDetailForm.get('startSeconds').value, 10)) {
      this.presentToast('The starting seconds need to be earlier than the end seconds.');
      return;
    }

    this.saveButtonDisabled = true;
    var oSpot = {
        title : title,
        strategy : strategy,
        tags : tags,

        // optional properties for youtube
        videoId : undefined,
        startSeconds : undefined,
        endSeconds : undefined,
        end : undefined,


        // optional properties for 
        angle : undefined,
        picture_1 : undefined,
        picture_2 : undefined,
        picture_3 : undefined
    };
    if (strategy === "smoke" || strategy === "decoy" || strategy === 'brand') {
      oSpot.videoId = this.youtubeDetailForm.get('videoId').value;
      oSpot.startSeconds = parseInt(this.youtubeDetailForm.get('startSeconds').value, 10);
      oSpot.endSeconds = parseInt(this.youtubeDetailForm.get('endSeconds').value, 10);
    } else {
      oSpot.angle = this.gfycatDetailForm.get('angle').value;
      oSpot.picture_1 = this.gfycatDetailForm.get('picture_1').value;
      oSpot.picture_2 = this.gfycatDetailForm.get('picture_2').value;
      oSpot.picture_3 = this.gfycatDetailForm.get('picture_3').value;
    }
    this.spotIdData.submitSpot(oSpot).subscribe((spot: any) => {
      this.presentToast('Spot successfully created. Lean back while we verify your great spot!');
    })
  }

  displayDetails() {
    this.detailsInvisible = false;
  }

  presentToast(message) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 7000
    });
    toast.present();
  }

}
