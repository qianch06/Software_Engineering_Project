(function(root){
  // The packaged HTML shares HTML5+ storage with the app, avoiding file-origin cache changes.
  function start(){
    const native=typeof plus!=='undefined';
    root.GamePlatform={native,
      storage:{getItem:k=>native?plus.storage.getItem(k):localStorage.getItem(k),setItem:(k,v)=>native?plus.storage.setItem(k,v):localStorage.setItem(k,v)},
      vibrate:ms=>{if(native)plus.device.vibrate(ms);else navigator.vibrate?.(ms);},
      exit:()=>{if(native)plus.runtime.quit();},
      ready:true
    };
    document.dispatchEvent(new Event('game-platform-ready'));
  }
  if(typeof plus!=='undefined')start();else if(/Html5Plus/i.test(navigator.userAgent))document.addEventListener('plusready',start,{once:true});else start();
})(window);
