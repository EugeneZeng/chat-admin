<template>
    <div class="jumbotron">
		<div class="container text-left">
			<h1>{{title}}</h1>
			<loginForm></loginForm>
		</div>
	</div>
</template>

<script>
import LoginForm from './LoginForm';

export default {
    name: 'login',
    data() {
        return {
            title: '后台聊天室登录'
        };
    },
    components: { LoginForm }
};
</script>