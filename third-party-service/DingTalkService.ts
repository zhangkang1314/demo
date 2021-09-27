import axios from "axios";
import * as dd from "dingtalk-jsapi";
import { Util } from "ibz-core";
import qs from 'qs';
/**
 * 钉钉服务
 *
 * @export
 * @class DingTalkService
 */
export class DingTalkService {

    /**
     * 唯一实例
     *
     * @private
     * @static
     * @memberof DingTalkService
     */
    private static readonly instance = new DingTalkService();

    /**
     * 用户信息缓存key
     *
     * @private
     * @type {string}
     * @memberof DingTalkService
     */
    private readonly infoName: string = "";
    /**
     * 企业corpId
     *
     * @private
     * @type {string}
     * @memberof WeChatService
     */
    private corpId: string = "";
    /**
     * 钉钉sdk
     *
     * @memberof DingTalkService
     */
    public readonly dd = dd;

    /**
     * 钉钉是否已经初始化
     *
     * @private
     * @type {boolean}
     * @memberof DingTalkService
     */
    private $isInit: boolean = false;
    /**
     * 是否已经初始化
     *
     * @type {boolean}
     * @memberof DingTalkService
     */
    public get isInit(): boolean {
        return this.$isInit;
    }


    /**
     * Creates an instance of DingTalkService.
     * @memberof DingTalkService
     */
    private constructor() {
        if (DingTalkService.instance) {
            return DingTalkService.instance;
        }
        this.init();
    }

    /**
     * 钉钉初始化  鉴权
     * @memberof DingTalkService
     */
    private init() {
        this.getAccess_token().then((access_token: any) => {
            // 钉钉初始化
            dd.ready(() => {
                this.$isInit = true;
                this.dd_ready();
            });
            //  钉钉鉴权
            if (access_token) {
                dd.config({
                    agentId: access_token.agentId, // 必填，微应用ID
                    corpId: access_token.corpId, //必填，企业ID
                    timeStamp: access_token.timeStamp, // 必填，生成签名的时间戳
                    nonceStr: access_token.nonceStr, // 必填，生成签名的随机串
                    signature: access_token.signature, // 必填，签名
                    type: 0, //选填。0表示微应用的jsapi,1表示服务窗的jsapi；不填默认为0。该参数从dingtalk.js的0.8.3版本开始支持
                    jsApiList: [
                        "device.audio.startRecord",
                        "device.audio.stopRecord",
                        "device.audio.onRecordEnd",
                        "device.audio.translateVoice",
                    ], // 必填，需要使用的jsapi列表，注意：不要带dd。
                });
            }
            dd.error((err: any) => {
                // alert(`dd加载错误：${JSON.stringify(err)}`);
            });
        });
    }

    /**
     * 钉钉初始化回调方法
     */
    private dd_ready() {
        this.setNavBack();
    }

    /**
     * 获取access_token
     */
    public async getAccess_token(): Promise<any> {
        return new Promise((resolve, reject) => {
            let access_token = localStorage.getItem("access_token");
            if (access_token && JSON.parse(access_token).time && !(new Date().getTime() - JSON.parse(access_token).time > 5400000)) {
                // 鉴权信息2小时过期 设置一小时五十分钟
                resolve(JSON.parse(access_token));
            } else {
                let openAccessId = document.referrer ? document.referrer : "dingtalk";
                let url = window.location.href.replace(window.location.hash, '')
                const promise: Promise<any> = this.get(`/uaa/dingtalk/jsapi/sign?` + qs.stringify({ openAccessId: openAccessId, url: url }));
                promise.then((response: any) => {
                    if (response && response.status === 200) {
                        localStorage.setItem("access_token", JSON.stringify(Object.assign(response.data, { time: new Date().getTime() })));
                        resolve(response.data);
                    } else {
                        resolve(null);
                    }
                }).catch((response: any) => {
                    console.error(response);
                    resolve(null);
                });
            }
        });
    }

    /**
     * 钉钉登录
     *
     * @memberof DingTalkService
     */
    public async login(): Promise<any> {
        const access_token: any = await this.get(`/uaa/open/dingtalk/access_token`);
        if (access_token.status == 200 && access_token.data && access_token.data.corp_id) {
            localStorage.setItem("access_token", JSON.stringify(Object.assign(access_token, new Date().getTime)));
            this.corpId = access_token.data.corp_id;
            const res: any = await dd.runtime.permission.requestAuthCode({ corpId: this.corpId, });
            if (res && res.code) {
                const userInfo: any = await this.get(`/uaa/open/dingtalk/auth/${res.code}`);
                if (userInfo.status == 200 && userInfo.data.token && userInfo.data.user) {
                    localStorage.setItem("token", userInfo.data.token);
                    localStorage.setItem("user", JSON.stringify(userInfo.data.user));
                    return { issuccess: true, message: "" };
                } else if (userInfo.status == 400) {
                    return { issuccess: false, message: userInfo.data.message };
                } else {
                    return { issuccess: false, message: userInfo.data.message };
                }
            } else {
                return { issuccess: false, message: "钉钉用户信息获取失败" };
            }
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
            axios.get(url)
                .then((response: any) => {
                    resolve(response);
                }).catch((error: any) => {
                    resolve(error);
                    console.log("请求异常");
                });
        });
    }

    /**
     * 开始录音
     *
     * @memberof DingTalkService
     */
    private startRecord(): Promise<any> {
        return new Promise((resolve, reject) => {
            dd.device.audio.startRecord({
                onSuccess: () => {
                    resolve(true)
                    //支持最长为300秒（包括）的音频录制，默认60秒(包括)。
                },
                onFail: () => {
                    resolve(false)
                },
            });
        });
    }

    /**
     * 停止录音
     *
     * @memberof DingTalkService
     */
    private stopRecord(): Promise<any> {
        return new Promise((resolve, reject) => {
            dd.device.audio.stopRecord({
                onSuccess: (res: any) => {
                    res.mediaId; // 返回音频的MediaID，可用于本地播放和音频下载
                    res.duration; // 返回音频的时长，单位：秒
                    resolve(res);
                },
                onFail: (err: any) => {
                    // alert(JSON.stringify(err));
                },
            });
        });
    }

    /**
     * 语音转文字
     *
     * @memberof DingTalkService
     */
    private translateVoice(arg: any): Promise<any> {
        return new Promise((resolve, reject) => {
            dd.device.audio.translateVoice({
                mediaId: arg.mediaId,
                duration: arg.duration,
                onSuccess: (res: any) => {
                    res.mediaId; // 转换的语音的mediaId
                    res.content; // 语音转换的文字内容
                    resolve(res);
                },
                onFail: (err: any) => {
                },
            });
        });
    }

    /**
     * 震动
     */
    public vibrate(arg: any): Promise<any> {
        return new Promise((resolve, reject) => {
            dd.device.notification.vibrate({
                duration: arg, //震动时间，android可配置 iOS忽略
            })
            resolve({});
        });

    }

    /**
     * 清楚登录用户信息
     *
     * @memberof DingTalkService
     */
    public clearUserInfo(): void {
        dd.util.domainStorage.removeItem({ name: this.infoName });
    }

    /**
     * 获取用户信息
     *
     * @returns {Promise<any>}
     * @memberof DingTalkService
     */
    public getUserInfo(): Promise<any> {
        return dd.util.domainStorage.getItem({ name: this.infoName });
    }

    /**
     * 获取实例
     *
     * @memberof DingTalkService
     */
    public static getInstance(): DingTalkService {
        return DingTalkService.instance;
    }

    /**
     * 关闭钉钉应用
     *
     * @memberof DingTalkService
     */
    public close() {
        dd.biz.navigation.close({});
    }

    /**
     * 设置钉钉标题
     *
     * @memberof DingTalkService
     */
    private setTitle(title: string) {
        dd.biz.navigation.setTitle({
            title: title,
        });
    }

    /**
     * 设置钉钉导航栏返回按钮
     *
     * @memberof DingTalkService
     */
    private setNavBack() {
        
    }

    /**
     * 钉钉导航栏返回事件
     *
     * @memberof DingTalkService
     */
    public initRightBtn({ model, fun }: any) {
        if (model) {
            const nameArr = Object.keys(model).filter((item: any) => {
                return model[item].visabled;
            })
            // 单个按钮
            if (nameArr.length == 1) {
                const btn = model[nameArr[0]];
                dd.biz.navigation.setRight({
                    show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                    control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                    text: btn.caption,//控制显示文本，空字符串表示显示默认文本
                    onSuccess: () => {
                        fun({ tag: btn.name });
                    }
                });
            }
            // 多个按钮 todo
        } else {
            dd.biz.navigation.setRight({
                show: false,//控制按钮显示， true 显示， false 隐藏， 默认true
                control: false,//是否控制点击事件，true 控制，false 不控制， 默认false
                text: '',//控制显示文本，空字符串表示显示默认文本
                onSuccess: () => {
                }
            });
        }
    }



    /**
     * 钉钉导航栏返回事件
     *
     * @memberof DingTalkService
     */
    private backEvent: Function = () => { };

    /**
     * 设置钉钉导航栏返回事件
     *
     * @memberof DingTalkService
     */
    private setBackEvent(event: Array<Function>) {
        this.backEvent = event[event.length - 1];
    }

    /**
     * 是否调用导航栏返回事件
     *
     * @memberof DingTalkService
     */
    private controlBackEvent() {
        // if (this.$store.state.selectStatus && this.$store.state.noticeStatus) {
        //     this.backEvent();
        // }
    }

    /**
     * 钉钉开放事件
     *
     *  @memberof DingTalkService
     */
    public async event(tag: string, arg: any) {
        if (Object.is(tag, "startRecord")) {
            return this.startRecord();
        }
        if (Object.is(tag, "stopRecord")) {
            return this.stopRecord();
        }
        if (Object.is(tag, "translateVoice")) {
            return this.translateVoice(arg);
        }
        if (Object.is(tag, "login")) {
            return this.login();
        }
        if (Object.is(tag, "setTitle")) {
            return this.setTitle(arg);
        }
        if (Object.is(tag, "setBackEvent")) {
            return this.setBackEvent(arg);
        }
        if (Object.is(tag, "close")) {
            return this.close();
        }
        if (Object.is(tag, "vibrate")) {
            return this.vibrate(arg);
        }
        if (Object.is(tag, "initRightBtn")) {
            return this.initRightBtn(arg);
        }
    }
}