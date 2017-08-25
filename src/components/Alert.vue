<template>
    <div>
        <b-alert variant="success" show @dismissed="showDismissibleAlert=true"> Hello {{ name }}! </b-alert>
        <b-alert 
            variant="danger" 
            dismissible 
            :show="showDismissibleAlert"
            @dismissed="showDismissibleAlert=false; showAlert()"> DismissibleAlert! </b-alert>
        <b-alert
            variant="danger" 
            dismissible
            :show="dismissCountDown"
            @dismissed="dismissCountdown=0"
            @dismiss-count-down="countDownChanged"
        >
            This alert will dismiss after {{dismissCountDown}} seconds...
        </b-alert>
    </div>
</template>

<script>
export default {
    data() {
        return {
            name: 'Eugene',
            showDismissibleAlert: false,
            dismissCountDown: 0,
            dismissSecs: 10
        };
    },
    methods: {
        countDownChanged(dismissCountDown) {
            this.dismissCountDown = dismissCountDown;
        },
        showAlert() {
            this.dismissCountDown = this.dismissSecs;
        }
    }
};
</script>