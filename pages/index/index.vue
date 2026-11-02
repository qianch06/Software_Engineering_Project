<template>
  <web-view :src="gameSource" :webview-styles="{ progress: false }" :update-title="false" />
</template>
<script>
export default {
  data() {
    return { gameSource: '' }
  },
  onLoad() {
    // #ifdef H5
    this.gameSource = import.meta.env.BASE_URL + 'static/game/index.html'
    // #endif
    // #ifdef APP-PLUS
    this.gameSource = '/static/game/index.html'
    // #endif
  },
  onHide() { this.send('pause') },
  onBackPress() { this.send('back'); return true },
  methods: {
    send(type, data) {
      // #ifdef APP-PLUS
      const child = this.$scope.$getAppWebview().children()[0]
      if (child) child.evalJS(`window.dispatchEvent(new CustomEvent('native-input',{detail:${JSON.stringify({type,data})}}))`)
      // #endif
    }
  }
}
</script>
