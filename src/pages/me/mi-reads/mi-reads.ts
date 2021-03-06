import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, ModalController, AlertController } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthProvider, ErrorHandlerProvider, IonicProvider } from '../../../shared/index';
import { BlogModel, UserModel } from '../../../models/index';
import { Search } from '../../../components/index';
import { Blog, BlogComments } from '../..//index';
import { SocialSharing } from '@ionic-native/social-sharing';
import * as _ from 'lodash';


@Component({
  selector: 'mi-reads',
  templateUrl: 'mi-reads.html'
})
export class MiReads implements OnInit{

  mi: UserModel;
  blog_type: string = 'food';
  segments: Array<{ title: string; click?: (e: any) => void }>
  blogs: BlogModel[];
  isLoading: boolean;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private socialshare: SocialSharing,
    private data$: AngularFireDatabase,
    private auth$: AuthProvider,
    private ionic$: IonicProvider,
    private error$: ErrorHandlerProvider
  ) { }

  ngOnInit() {
    this.mi = this.auth$.currentUser;
  }

  ionViewDidEnter(){
     this.getData();
  }

  getData() {
    this.isLoading = true;
    this.data$.list('/blogs/').valueChanges()
      .subscribe((blogs: BlogModel[]) => {
        this.isLoading = false;
        this.blogs = blogs.filter(blog=> blog.bookmarks? blog.bookmarks[this.mi.uid]: null);
      })

  }

  search() {
    let modal = this.modalCtrl.create(Search, { searchable: ['title', 'type','content'] });
    modal.onDidDismiss((search) => {
      if (search) {
        this.blogs.filter(blog => {
          return search.title ? blog.title.toLowerCase().indexOf(search.title.toLowerCase()) > -1 : null
            || search.type ? blog.type.toLowerCase().indexOf(search.type.toLowerCase()) > -1 : null
            || search.content ? blog.content.toLowerCase().indexOf(search.content.toLowerCase()) > -1 : null
        })
      }
    })
    modal.present();
  }

  open(blog) {
    this.navCtrl.push(Blog, blog);
  }

  likedByUser(blog) {
    blog.likes_count = _.size(blog.likes);
    blog.comments_count = _.size(blog.comments);
    return blog.likes ? blog.likes[this.mi.uid] : undefined;
  }
  bookmarked(blog:BlogModel){
    return blog.bookmarks ? blog.bookmarks[this.mi.uid] : undefined;
  }

  like(blog) {
    let likedbyUser = blog.likes ? blog.likes[this.mi.uid] : undefined;
    if (!likedbyUser) {
      this.data$.object('/blogs/' + blog.$key + '/likes/' + this.mi.uid)
        .set({
          name: this.mi.fullname ? this.mi.fullname : '',
          picture: this.mi.picture ? this.mi.picture : '',
          date: new Date()
        })
        .then(() => this.ionic$.presentToast('You Liked this post'),
        error => this.error$.handleError(error));
    } else {
      this.data$.object('/blogs/' + blog.$key + '/likes/' + this.mi.uid)
        .remove().then(() => this.ionic$.presentToast('You Unliked this post'),
        error => this.error$.handleError(error));
    }
  }

  comment(blog) {
    let modal = this.modalCtrl.create(BlogComments, blog);
    modal.present();
  }

  share(blog) {
    this.socialshare.share();
  }

  delete(blog) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this post?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Delete',
          cssClass:'primary-button',
          handler: () => {
            this.data$.object('/blogs/' + blog.$key).remove()
              .then(() => this.ionic$.presentToast('You have deleted this post'),
              error => this.error$.handleError(error))
          }
        }
      ]
    });
    alert.present();

  }

  bookmark(blog) {
    let bookmarked = blog.bookmarks ? blog.bookmarks[this.mi.uid] : undefined;
    if (!bookmarked) {
      this.data$.object('/blogs/' + blog.$key + '/bookmarks/' + this.mi.uid)
        .set(this.mi.uid)
        .then(() => this.ionic$.presentToast('You have saved this post'),
        error => this.error$.handleError(error));
    } else {
      this.data$.list('/blogs/' + blog.$key + '/bookmarks/' + this.mi.uid)
        .remove()
        .then(() => this.ionic$.presentToast('You have saved this post'),
        error => this.error$.handleError(error));
    }
  }

}
