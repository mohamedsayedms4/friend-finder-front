import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { HeaderComponent } from './componants/header/header.component';
import { FooterComponent } from './componants/footer/footer.component';
import { SignUpComponent } from './componants/sign-up/sign-up.component';
import { ContactComponent } from './componants/contact/contact.component';
import { UserhomeComponent } from './componants/userhome/userhome.component';
import { LeftBarComponent } from './componants/userhome/left-bar/left-bar.component';
import { RightBarComponent } from './componants/userhome/right-bar/right-bar.component';
import { PublishComponent } from './componants/userhome/publish/publish.component';
import { FriendsComponent } from './componants/userhome/friends/friends.component';
import { CoolImagesComponent } from './componants/userhome/cool-images/cool-images.component';
import { MainPageComponent } from './componants/userhome/main-page/main-page.component';
import { TimeLinesComponent } from './componants/time-lines/time-lines.component';
import { TimeLineComponent } from './componants/time-lines/time-line/time-line.component';
import { TimeAboutComponent } from './componants/time-lines/time-about/time-about.component';
import { TimeAlbumComponent } from './componants/time-lines/time-album/time-album.component';
import { TimeFriendsComponent } from './componants/time-lines/time-friends/time-friends.component';
import { TimeLineProfileComponent } from './componants/time-lines/time-line-profile/time-line-profile.component';
import { TimeLineDetailesComponent } from './componants/time-lines/time-line-detailes/time-line-detailes.component';
import { LoginComponent } from './componants/login/login.component';

import { NoauthGuard } from 'src/service/guard/noauth.guard';
import { AuthGuard } from 'src/service/guard/auth.guard';
import { AuthInterceptor } from 'src/service/interceptor/auth.interceptor';

const routes: Routes = [
  { path: 'signup', component: SignUpComponent, canActivate: [NoauthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [NoauthGuard] },

  { path: '', redirectTo: 'mainpage', pathMatch: 'full', canActivate: [AuthGuard] },
  { path: 'mainpage', component: MainPageComponent, canActivate: [AuthGuard] },
  { path: 'contact', component: ContactComponent, canActivate: [AuthGuard] },
  { path: 'timeline', component: TimeLineComponent, canActivate: [AuthGuard] },
  { path: 'timeline-about', component: TimeAboutComponent, canActivate: [AuthGuard] },
  { path: 'timeline-friends', component: TimeFriendsComponent, canActivate: [AuthGuard] },
  { path: 'timeline-album', component: TimeAlbumComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'mainpage' },
];

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    SignUpComponent,
    ContactComponent,
    UserhomeComponent,
    LeftBarComponent,
    RightBarComponent,
    PublishComponent,
    FriendsComponent,
    CoolImagesComponent,
    MainPageComponent,
    TimeLinesComponent,
    TimeLineComponent,
    TimeAboutComponent,
    TimeAlbumComponent,
    TimeFriendsComponent,
    TimeLineProfileComponent,
    TimeLineDetailesComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    FormsModule,          // ✅ لازم لـ ngModel
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
