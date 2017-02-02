<template>
<div role="tabpanel" id="achievementsPane" class="achievements-pane tab-pane">
  <h3>Achievements</h3>
  <div v-for="achObj in achData">
    <!-- true:  Generate a line break -->
    <div v-if="achObj === true">
      <div style='clear:both;'><br></div>
    </div>
    <!-- false: Generate a gap -->
    <div v-else-if="achObj === false">
      <div class='break'>&nbsp;</div>
    </div>
    <!-- An achievement (or civ size) object: Generate the display of that achievement -->
    <div v-else="">
      <div class='achievement' :title='achObj.getQtyName()'>
        <div class='unlockedAch' :id='achObj.id'>{{achObj.getQtyName()}}</div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name:  'achievements-pane',
  props: ['achData'],
  data() {
    return {}
  },
  mounted() {
    this.$nextTick(() => {})
  },
  methods: {},
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
