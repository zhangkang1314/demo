import axios from 'axios';
import * as wx from 'weixin-js-sdk';

/**
 * 惬意微信服务
 *
 * @export
 * @class WeChatService
 */
export class WeChatService {
    /**
     * 唯一实例
     *
     * @private
     * @static
     * @type {WeChatService}
     * @memberof WeChatService
     */
    private static readonly instance: WeChatService = new WeChatService();
    
    /**
     * 用户信息缓存key
     *
     * @private
     * @type {string}
     * @memberof WeChatService
     */
    private readonly infoName: string = "UserInfo";

    /**
     * 企业corpId
     *
     * @private
     * @type {string}
     * @memberof WeChatService
     */
    private readonly appId: string = "ww41b9cbca11ed5dbb";

    /**
     * 微信SDK
     *
     * @protected
     * @type {*}
     * @memberof WeChatService
     */
    protected wx: any = wx;

    /**
     * 是否初始化
     *
     * @protected
     * @type {boolean}
     * @memberof WeChatService
     */
    protected $isInit: boolean = false;
    public get isInit(): boolean {
        return this.$isInit;
    }
    /**
     * Creates an instance of WeChatService.
     * @memberof WeChatService
     */
    private constructor() {
        if (WeChatService.instance) {
            return WeChatService.instance;
        }
        this.init();
    }

    /**
     * 初始化
     *
     * @protected
     * @returns {Promise<void>}
     * @memberof WeChatService
     */
    protected async init(): Promise<void> {
        const info: string = window.navigator.userAgent.toUpperCase();
        if (info.indexOf('WXWORK') !== -1) {
            // 企业微信js-sdk相关，暂未用到注释
            // const win: any = window;
            // this.wx = win.wx;
            // if (this.wx) {
            //     const data: any = await this.get('./wechat/config?url=' + encodeURIComponent(window.location.origin));
            //     if (data) {
            //         const config = {
            //             beta: true,// 必须这么写，否则wx.invoke调用形式的jsapi会有问题
            //             debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            //             appId: data.appid, // 必填，企业微信的corpID
            //             timestamp: data.timestamp, // 必填，生成签名的时间戳
            //             nonceStr: data.nonceStr, // 必填，生成签名的随机串
            //             signature: data.signature,// 必填，签名，见 附录-JS-SDK使用权限签名算法
            //             jsApiList: [] // 必填，需要使用的JS接口列表，凡是要调用的接口都需要传进来
            //         }
            //         this.wx.config(config);
            //         this.wx.ready(() => {
            //             this.$isInit = true;
            //             alert('微信初始化成功');
            //         });
            //         this.wx.error((res: any) => {
            //             // alert('微信信息初始化失败!---' + JSON.stringify(res));
            //         });
            //     }
            // }
            this.$isInit = true;
        }
    }

    /**
     * 登录
     *
     * @returns {Promise<any>}
     * @memberof WeChatService
     */
    public async login(): Promise<any> {
        let userInfo = this.getUserInfo();
        if (!userInfo) {
            const code = this.getQueryValue1('code');
            if (code && !Object.is(code, '')) {
                const res = await this.get(`./wechat/login?code=${code}`);
                if (res) {
                    window.localStorage.setItem(this.infoName, res);
                    userInfo = res;
                }
            } else {
                window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.appId}&redirect_uri=${encodeURIComponent(window.location.href)}&response_type=code&scope=snsapi_base&state==#wechat_redirect`;
            }
        }
        return userInfo;
    }

    /**
     * 清楚登录用户信息
     *
     * @memberof WeChatService
     */
    public clearUserInfo(): void {
        window.localStorage.removeItem(this.infoName);
    }

    /**
     * 获取用户信息
     *
     * @returns {*}
     * @memberof WeChatService
     */
    public getUserInfo(): any {
        return window.localStorage.getItem(this.infoName);
    }

    /**
     * 获取url参数
     *
     * @private
     * @param {string} queryName
     * @returns
     * @memberof WeChatService
     */
    private getQueryValue1(queryName: string) {
        var reg = new RegExp("(^|&)" + queryName + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return decodeURI(r[2]);
        } else {
            return null;
        }
    }

    /**
     * 请求(需要替换为项目)
     *
     * @private
     * @param {string} url
     * @returns {Promise<any>}
     * @memberof DingTalkService
     */
    private async get(url: string): Promise<any> {
        return new Promise((resolve) => {
            axios.get(url).then((response: any) => {
                resolve(response.data);
            }).catch((error: any) => {
                console.log('请求异常');
            });
        })
    }

    /**
     * 获取实例
     *
     * @static
     * @returns {WeChatService}
     * @memberof WeChatService
     */
    public static getInstance(): WeChatService {
        return WeChatService.instance;
    }

    /**
     * 关闭微信应用
     *
     * @static
     * @returns {WeChatService}
     * @memberof WeChatService
     */
    public close(){
        // 关闭
    }

    /**
     * 设置微信标题
     *
     * @static
     * @returns {DingTalkService}
     * @memberof DingTalkService
     */
    public setTitle(title:string){
        // 设置标题
    }

    /**
     * 微信导航栏返回事件
     *
     * @static
     * @returns {DingTalkService}
     * @memberof DingTalkService
     */
    private backEvent:Function = ()=>{};

    /**
     * 设置微信导航栏返回事件
     *
     * @static
     * @returns {DingTalkService}
     * @memberof DingTalkService
     */
    public setBackEvent(event:Array<Function>){
        
    }

    /**
     * wx事件
     *
     * @param {string} tag
     * @param {*} [arg={}]
     * @memberof WeChatService
     */
    public event(tag: string, arg: any = {}){

    }
}