import { Storage } from '@ionic/storage';
import { AuthHttp, JwtHelper, tokenNotExpired } from 'angular2-jwt';
import { Injectable, NgZone } from '@angular/core';

declare var Auth0: any;
declare var Auth0Lock: any;

@Injectable()
export class Auth {

  jwtHelper: JwtHelper = new JwtHelper();
  auth0 = new Auth0({clientID: '2DUB2F7bjjkMw9SsBVzcMYJ1XcOysZJa', domain: 'crowddash.auth0.com'});
  lock = new Auth0Lock('2DUB2F7bjjkMw9SsBVzcMYJ1XcOysZJa', 'crowddash.auth0.com', {
    auth: {
      redirect: false,
      params: {
        scope: 'openid profile offline_access',
        device: 'my-device'
      },
      sso: false
    }
  });
  user: any;
  zoneImpl: NgZone;
  accessToken: string;
  idToken: string;

  constructor(private authHttp: AuthHttp, zone: NgZone, public storage: Storage) {
    this.zoneImpl = zone;
    // Check if there is a profile saved in local storage
    this.storage.get('profile').then(profile => {
      this.user = JSON.parse(profile);
    }).catch(error => {
      console.log(error);
    });

    this.storage.get('access_token').then(token => {
      this.accessToken = token;
    });

    this.lock.on('authenticated', authResult => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.storage.set('access_token', authResult.accessToken);
        this.storage.set('id_token', authResult.idToken);
        this.storage.set('refresh_token', authResult.refreshToken);
        this.accessToken = authResult.accessToken;
        this.idToken = authResult.idToken;

        // Fetch profile information
        this.lock.getUserInfo(this.accessToken, (error, profile) => {
          if (error) {
            alert(error);
            return;
          }

          profile.user_metadata = profile.user_metadata || {};
          this.storage.set('profile', JSON.stringify(profile));
          this.user = profile;
        });

        this.lock.hide();

        this.zoneImpl.run(() => this.user = authResult.profile);
      }
    });
  }

  public authenticated() {
    return tokenNotExpired('id_token', this.idToken);
  }

  public login() {
    // Show the Auth0 Lock widget
    this.lock.show();
  }

  public logout() {
    this.storage.remove('profile');
    this.storage.remove('access_token');
    this.storage.remove('id_token');
    this.idToken = null;
    this.storage.remove('refresh_token');
    this.zoneImpl.run(() => this.user = null);
  }
}
