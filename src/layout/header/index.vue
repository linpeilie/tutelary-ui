<script setup lang="ts">
import FullScreen from './components/FullScreen.vue'
import UserAvatar from './components/UserAvatar.vue'
import GithubSite from './components/GithubSite.vue'
import ThemeMode from './components/ThemeMode.vue'
import HeaderLogo from "@/layout/header/components/HeaderLogo.vue";
import HeaderMenu from "@/layout/header/components/HeaderMenu.vue";
</script>

<template>
	<div flex items-center>
		<HeaderLogo/>
		<n-divider vertical />
		<HeaderMenu/>
	</div>
	<div ml-auto flex items-center>
		<ThemeMode/>
		<GithubSite/>
		<FullScreen/>
		<UserAvatar/>
	</div>
</template>
