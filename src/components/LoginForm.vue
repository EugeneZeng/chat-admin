<template>
    <div>
        <b-form @submit="onsubmit()">
            <b-form-group id="loginUserName"
                label="用户名：" label-for="userNameInput"
                description="请输入分析师或者客服的用户名">
                <b-form-input id="userNameInput" 
                    type="text" v-model="form.username" required
                    placeholder="用户名">
                </b-form-input>
            </b-form-group>
            <b-form-group id="loginUserPassword"
                label="密码：" label-for="passwordInput"
                description="请输入分析师或者客服的密码">
                <b-form-input id="passwordInput" 
                    type="password" v-model="form.password" required
                    placeholder="密码">
                </b-form-input>
            </b-form-group>
            <b-button type="submit" varient="primary">登陆</b-button>
            <b-button type="reset" varient="secondry">重置</b-button>
        </b-form>   
    </div>
</template>

<script>
export default {
    data() {
        return {
            form: {
                username: '',
                password: ''
            }
        };
    },
    methods: {
        onsubmit() {
            console.warn(JSON.stringify(this.form));
        }
    }
};
</script>