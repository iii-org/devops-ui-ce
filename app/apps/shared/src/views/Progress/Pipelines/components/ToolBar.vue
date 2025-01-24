<template>
  <div class="flex justify-between mt-5 mb-5">
    <div>
      {{ $t('DevSecOps.Tools') }}:
      <slot name="toolName"></slot>
    </div>
    <div>
      <slot name="warning"></slot>
      <slot name="link"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToolBar'
}
</script>
