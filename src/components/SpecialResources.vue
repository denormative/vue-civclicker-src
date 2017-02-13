<template>
<div class="special-resources card">
  <h4 class="card-header" v-show="settings.showHeaders">Special Resources</h4>
  <div id="specialResourcesContainer" class="card-block">
    <div class="row">
      <div class="col-4" v-for="specialItem in specialItems">
        <div class="row" :id="civData.gold.owned >= 1">
          <div class="col col-auto"><img :src="'/static/civclicker/images/'+specialItem.id+'.png'" class="icon icon-lg" :alt="specialItem.id" /></div>
          <div class="col">
            <span class="text-capitalize font-weight-bold">{{specialItem.id}}</span><br>
            <span data-action="display" :data-target="specialItem.id">0</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name:  'special-resources',
  props: ['civData'],
  data() {
    return {
      specialItems: [
        { id: 'skins' },
        { id: 'herbs' },
        { id: 'ore' },
        { id: 'leather' },
        { id: 'piety' },
        { id: 'metal' },
        { id: 'gold' },
      ],
    }
  },
  mounted() {
    this.$nextTick(() => {})
  },
  computed: {
    ...mapState(['settings']),
  },
}
</script>

<style>
</style>
