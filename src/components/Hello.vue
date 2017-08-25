<template>
    <div class="jumbotron">
    <div class="container text-left">
        <h1>{{ msg }}<b-badge pill variant="success">New</b-badge></h1>
        <h2>Essential Links<b-badge variant="primary">New</b-badge></h2>
        <ul>
            <li><a href="https://vuejs.org" target="_blank">Core Docs</a></li>
            <li><a href="https://forum.vuejs.org" target="_blank">Forum</a></li>
            <li><a href="https://gitter.im/vuejs/vue" target="_blank">Gitter Chat</a></li>
            <li><a href="https://twitter.com/vuejs" target="_blank">Twitter</a></li>
            <br>
            <li><a href="http://vuejs-templates.github.io/webpack/" target="_blank">Docs for This Template</a></li>
        </ul>
        <h2>Ecosystem</h2>
        <ul>
            <li><a href="http://router.vuejs.org/" target="_blank">vue-router</a></li>
            <li><a href="http://vuex.vuejs.org/" target="_blank">vuex</a></li>
            <li><a href="http://vue-loader.vuejs.org/" target="_blank">vue-loader</a></li>
            <li><a href="https://github.com/vuejs/awesome-vue" target="_blank">awesome-vue</a></li>
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
            msg: 'Welcome to Your Vue.js App'
        };
    },
    components: { Alert }
};
</script>
