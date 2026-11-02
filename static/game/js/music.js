(function(root){
  'use strict';
  class BackgroundMusic {
    constructor(enabled){
      this.enabled=enabled;this.unlocked=false;this.suspended=false;this.gamePaused=false;
      this.track=new Audio('audio/background.mp3');this.track.loop=true;this.track.volume=.22;this.track.preload='none';
      const unlock=()=>{this.unlocked=true;this.suspended=false;this.sync();};
      document.addEventListener('pointerdown',unlock);
      document.addEventListener('keydown',unlock);
      window.addEventListener('blur',()=>{this.suspended=true;this.sync();});
      window.addEventListener('focus',()=>{this.suspended=false;this.sync();});
      document.addEventListener('visibilitychange',()=>this.sync());
      window.addEventListener('native-input',e=>{if(e.detail?.type==='pause'){this.suspended=true;this.sync();}});
    }
    sync(paused=this.gamePaused){
      this.gamePaused=paused;
      if(!this.enabled()||!this.unlocked||this.suspended||document.hidden||paused){this.track.pause();return;}
      // Autoplay may be blocked by the host WebView; a later gesture retries.
      if(this.track.paused)this.track.play()?.catch(()=>{});
    }
  }
  root.BackgroundMusic=BackgroundMusic;
})(window);
