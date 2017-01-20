<template>
<div role="tabpanel" id="achievementsPane" class="achievements-pane tab-pane">
  <div id="achievements">
    <h3>Achievements</h3>
  </div>
</div>
</template>

<script>
export default {
  name: 'achievements-pane',
  data() {
    return {}
  }
}
</script>

<style>
.achievement {
  display: block;
  float: left;
  width: 50px;
  height: 50px;
  border: 2px solid black;
  background-color: #aaa;
  background-image: url('/static/civclicker/images/achLocked.jpg');
}

.unlockedAch {
  box-sizing: border-box;
  -moz-box-sizing: border-box;
  /* Firefox needs a nonstandard name */
  width: 100%;
  height: 100%;
  padding: 0.2em;
  font-size: 0.9em;
  text-shadow: none;
  font-weight: normal;
  background-color: #fff;
  display: none;
  /* Initially */
}
</style>
