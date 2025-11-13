<script setup lang="ts">
import type {AppInfo} from '@/api/types/appTypes'

interface Props {
	app: AppInfo
}

const props = defineProps<Props>()

const emit = defineEmits<{
	click: [app: AppInfo]
}>()

function getAppStatusColor(instanceNum: number) {
	if (instanceNum === 0)
		return 'text-red-500'
	if (instanceNum < 3)
		return 'text-yellow-500'
	return 'text-green-500'
}

function getAppStatusText(instanceNum: number) {
	if (instanceNum === 0)
		return '离线'
	if (instanceNum < 3)
		return '运行中'
	return '健康'
}

function handleClick() {
	emit('click', props.app)
}
</script>

<template>
	<NCard @click="handleClick">
		<div>
			{{ props.app.appName }}
		</div>
		<div>
			注册时间 : {{ props.app.registerDate }}
		</div>
		<n-divider/>
		<n-space>
			<div>实例数量</div>
			<div>{{ props.app.instanceNum }}</div>
		</n-space>
	</NCard>
</template>

<style scoped lang="scss">
</style>