<template>
<div class="current-trade-pane">
  <div id="tradeContainer" class="card-block">
    Trader offers 1 gold for <span id="tradeRequested">0</span> <span id="tradeType">food</span><br>
    <button class="btn btn-primary" id="trader" onmousedown="trade()">Trade</button>
  </div>
</div>
</template>

<script>
export default {
  name: 'current-trade-pane',
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
}
</script>

<style scoped>
#tradeContainer {
  display: none;
  padding: 0.3em 0 0.5em 0;
  margin: 0.5em 0;
  text-align: center;
  background-color: #9d9;
  border-radius: 1.5em;
}

#trader {
  height: 2em;
  width: 70%;
}
</style>
