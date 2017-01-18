<template>
  <div class="special-resources">
    <div id="specialResourcesContainer">
      <h3>Special Resources</h3>
      <table>
        <tr>
          <td>Skins: </td>
          <td class="number"><span data-action="display" data-target="skins">0</span></td>
          <td><img src="/static/civclicker/images/skins.png" class="icon icon-lg" alt="Skins" /></td>
          <td>Leather: </td>
          <td class="number"><span data-action="display" data-target="leather">0</span></td>
          <td class="icon"><img src="/static/civclicker/images/leather.png" class="icon icon-lg" alt="Leather" /></td>
        </tr>
        <tr>
          <td>Herbs: </td>
          <td class="number"><span data-action="display" data-target="herbs">0</span></td>
          <td><img src="/static/civclicker/images/herbs.png" class="icon icon-lg" alt="Herbs" /></td>
          <td>Piety: </td>
          <td class="number"><span data-action="display" data-target="piety">0</span></td>
          <td class="icon"><img src="/static/civclicker/images/piety.png" class="icon icon-lg" alt="Piety" /></td>
        </tr>
        <tr>
          <td>Ore: </td>
          <td class="number"><span data-action="display" data-target="ore">0</span></td>
          <td><img src="/static/civclicker/images/ore.png" class="icon icon-lg" alt="Ore" /></td>
          <td>Metal: </td>
          <td class="number"><span data-action="display" data-target="metal">0</span></td>
          <td class="icon"><img src="/static/civclicker/images/metal.png" class="icon icon-lg" alt="Metal" /></td>
        </tr>
        <tr id="goldRow">
          <td>Gold: </td>
          <td class="number"><span data-action="display" data-target="gold">0</span></td>
          <td class="icon"><img src="/static/civclicker/images/gold.png" class="icon icon-lg" alt="Gold" /></td>
          <td colspan="3"></td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'special-resources',
  data () {
    return {
    }
  }
}
</script>

<style scoped>
</style>
