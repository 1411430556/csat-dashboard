<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
    <n-message-provider>
      <HomeView />
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
  import { NConfigProvider, NMessageProvider, zhCN, dateZhCN } from 'naive-ui'
  import type { GlobalThemeOverrides } from 'naive-ui'
  import HomeView from './views/HomeView.vue'

  const themeOverrides: GlobalThemeOverrides = {
    common: {
      primaryColor: '#70AD47',
      primaryColorHover: '#5B9438',
      primaryColorPressed: '#4E8030',
      primaryColorSuppl: '#70AD47',
      borderRadius: '9px',
      fontFamily:
        '"LXGW WenKai", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Source Han Sans SC", sans-serif',
    },
    Button: {
      borderRadiusMedium: '10px',
      borderRadiusSmall: '8px',
      fontWeight: '500',
    },
  }
</script>
