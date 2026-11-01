<template><web-view src="/static/game/index.html" @message="onMessage" /></template>
<script>
export default {
  onReady() {
    this.sensor = sample => this.send('sensor', sample)
    uni.onAccelerometerChange(this.sensor)
    uni.startAccelerometer({ interval:'game', fail:() => this.send('sensor-error') })
    // #ifdef APP-PLUS
    this.backHandler = () => { this.send('pause'); return true }
    // #endif
  },
  onHide() { this.send('pause'); uni.stopAccelerometer() },
  onShow() { if (this.sensor) uni.startAccelerometer({ interval:'game' }) },
  onUnload() { uni.stopAccelerometer(); uni.offAccelerometerChange(this.sensor) },
  onBackPress() { this.send('pause'); return true },
  methods: {
    send(type, data) {
      // #ifdef APP-PLUS
      const child = this.$scope.$getAppWebview().children()[0]
      if (child) child.evalJS(`window.dispatchEvent(new CustomEvent('native-input',{detail:${JSON.stringify({type,data})}}))`)
      // #endif
    },
    onMessage() {}
  }
}
</script>
