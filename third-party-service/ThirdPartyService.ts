import { IServiceApp } from 'src';
import { DingTalkService } from './DingTalkService';
import { WeChatService } from './WeChatService';
/**
 * 第三方服务
 *
 * @export
 * @class ThirdPartyService
 */
export class ThirdPartyService {

    /**
     * 唯一实例
     *
     * @private
     * @static
     * @type {ThirdPartyService}
     * @memberof ThirdPartyService
     */
    private static readonly instance: ThirdPartyService = new ThirdPartyService();

    /**
     * 当前搭载平台服务类
     *
     * @type {(DingTalkService|WeChatService)}
     * @memberof ThirdPartyService
     */
    private platformService!: DingTalkService | WeChatService;

    /**
     * 应用对象
     *
     * @private
     * @type {IServiceApp}
     * @memberof ThirdPartyService
     */
    private application!: IServiceApp;

    /**
     * Creates an instance of ThirdPartyService.
     * @memberof ThirdPartyService
     */
    private constructor() {
        if (ThirdPartyService.instance) {
            this.application = window.App;
            this.initPlatformService();
            return ThirdPartyService.instance;
        }

    }

    /**
     * 获取实例
     *
     * @static
     * @return {*}  {ThirdPartyService}
     * @memberof ThirdPartyService
     */
    public static getInstance(): ThirdPartyService {
        return ThirdPartyService.instance;
    }

    /**
     * 初始化搭载平台
     *
     * @memberof ThirdPartyService
     */
    public initPlatformService() {
        const p = this.application.getPlatFormType()
        if (Object.is(p, 'dd')) {
            this.platformService = DingTalkService.getInstance();
        } else if (Object.is(p, 'wx-pn')) {
            this.platformService = WeChatService.getInstance();
        }
    }

    /**
     * 获取当前搭载平台服务类
     *
     * @return {*} 
     * @memberof ThirdPartyService
     */
    public getPlatformService() {
        return this.platformService;
    }

    /**
     * 登录
     *
     * @returns {Promise<any>}
     * @memberof ThirdPartyService
     */
    public async login(): Promise<any> {
        try {
            return await this.platformService.login();
        } catch (error) {
            return { success: false, message: '登录失败' }
        }
    }

    /**
     * 清楚登录用户信息
     *
     * @memberof WeChatService
     */
    public clearUserInfo(): void {
        return this.platformService.clearUserInfo();
    }

    /**
     * 获取用户信息
     *
     * @returns {*}
     * @memberof WeChatService
     */
    public async getUserInfo(): Promise<any> {
        return this.platformService.getUserInfo();
    }

    /**
     * 关闭应用
     *
     * @memberof ThirdPartyService
     */
    public close() {
        this.platformService.close();
    }

    /**
     * 第三方事件
     *
     * @param {string} tag
     * @param {*} [arg={}]
     * @return {*}  {Promise<any>}
     * @memberof ThirdPartyService
     */
    public async thirdPartyEvent(tag: string, arg: any = {}): Promise<any> {
        // 未初始化
        if (!this.platformService.isInit) {
            return;
        }
        return await this.platformService.event(tag, arg);
    }
}