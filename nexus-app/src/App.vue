<template>
    <NexusLandingPage :setCurrentRoute="setCurrentRoute" />
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import NexusLandingPage from './components/NexusLandingPage.vue';
  
  const currentRoute = ref('landing');
  
  const setCurrentRoute = (route) => {
    currentRoute.value = route;
  };
  </script>