import { ComponentBase, GenerateComponent } from 'ibz-ui-ionic';
import { App } from '../../core';
import './app-login.scss';

/**
 * 应用登录组件
 *
 * @export
 * @class AppLogin
 */
export class AppLogin extends ComponentBase{

    /**
     * 是否为登录页
     *
     * @type {boolean}
     * @memberof AppLogin
     */
    public isloginPage: boolean = true;

    /**
     * 用户名
     *
     * @type {string}
     * @memberof AppLogin
     */
    public username: string = '';

    /**
     * 密码
     *
     * @type {string}
     * @memberof AppLogin
     */
    public password: string = '';

    /**
     * 登录
     * 
     * @memberof AppLogin
     */
    public login() {
        const data = {
            loginname: this.username,
            password: this.password,
        }
        App.getInstance().onLogin(data).then((response: any) => {
            if (response && response.status == 200) {
              App.getInstance().getOpenViewService().openView('/');
            } else {
              App.getInstance().getNoticeService().error('账户密码错误！')
            }
        });
    }

    /**
     * 绘制注册页面
     * 
     * @memberof AppLogin
     */
    renderRegisterPage() {
        return null;
    }

    /**
     * 初始化搭载平台
     *
     * @memberof AuthGuard
     */
    public getPlatFormType() {
        const info: string = window.navigator.userAgent.toUpperCase();
        App.getInstance().getNoticeService().success(info,6000);
    }

    /**
     * 绘制登录页面
     * 
     * @memberof AppLogin
     */
    renderLoginPage() {
        return (
            <div class="app-login-content">
                <form class="app-login-form">
                    <ion-title calss="title">登录</ion-title>
                    <ion-item lines="none">
                        <ion-label position="stacked">用户名：</ion-label>
                        <ion-input clear-input required type="text" debounce="100" value={this.username} onIonChange={($event: any) => this.username = $event.detail.value}></ion-input>
                    </ion-item>
                    <ion-item lines="none">
                        <ion-label position="stacked">密码：</ion-label>
                        <ion-input clear-input required type="password" debounce="100" value={this.password} onIonChange={($event: any) => this.password = $event.detail.value}></ion-input>
                    </ion-item>
                    <div class="ion-padding button">
                        <ion-button expand="block" class="login-button" onClick={() => this.login()}>登录</ion-button>
                        <ion-button expand="block" class="login-button" onClick={() => this.getPlatFormType()}>搭载平台</ion-button>
                    </div>
                </form>
            </div>
        )
    }

        /**
         * 初始化搭载平台
         *
         * @memberof AuthGuard
         */
         public initAppPlatFormType() {
            let platform = "";
            const info: string = window.navigator.userAgent.toUpperCase();
            // 钉钉
            if (info.indexOf('DINGTALK') !== -1) {
                platform = 'dd';
            // 微信小程序
            } else if (info.indexOf('WECHART') !== -1) {
                platform = 'wx';
            // 桌面端
            } else if (info.indexOf('ELECTRON') !== -1) {
                platform = 'desktop';
            }else if (info.indexOf('WXWORK') !== -1) {
                platform = 'WXWORK';
            // 安卓
            }else if (info.indexOf('ANDROID') !== -1) {
                platform = 'android';
            // 苹果
            }else if (info.indexOf('IPHONE') !== -1) {
                platform = 'ios';
            }else if (!!info.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
                platform = 'ios'; 
            }
            alert(platform)
            console.log(platform);
            // this.application.setPlatFormType(platform);
        }

        created(){
            this.initAppPlatFormType();
        }
    /**
     * 绘制登录组件
     * 
     * @memberof AppLogin
     */
    render() {
        return (
            <ion-page class="app-login">
                <ion-content fullscreen>
                    { this.isloginPage ? this.renderLoginPage() : this.renderRegisterPage()}
                </ion-content>
            </ion-page>
        )
    }
}

export const AppLoginComponent = GenerateComponent(AppLogin);