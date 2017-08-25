<template>
    <div class="jumbotron">
    <div class="container text-left">
        <h1>{{ msg }}<b-badge pill variant="success">New</b-badge></h1>
        <h2>Essential Links<b-badge variant="primary">New</b-badge></h2>
        <ul>
            <li><a href="/#/login">Login</a></li>
            <li><a href="https://forum.vuejs.org" target="_blank">Forum</a></li>
        </ul>
        <alert></alert>
    </div>
    </div>
</template>

<script>
import Alert from './Alert';

export default {
    name: 'hello',
    data() {
        return {
            msg: '欢迎光临直播室分析师后台'
        };
    },
    components: { Alert }
};
</script>
