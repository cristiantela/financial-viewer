<template>
  <span>
    <span
      v-for="(tag, index) in tags"
      :key="index"
      class="badge badge-primary mr-1"
    >
      {{ tag }}
    </span>
  </span>
</template>

<script>
  export default {
    name: 'tags',
    props: ['tags'],
  }
</script>