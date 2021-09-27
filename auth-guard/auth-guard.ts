import qs from 'qs';
import { getCookie, SyncSeriesHook } from 'qx-util';
import { GlobalHelp, DynamicInstanceConfig } from '@ibiz/dynamic-model-api';
import { getSessionStorage, setSessionStorage, AppModelService, Http, AppHooks } from 'ibz-core';
import { ServiceInstall, ThirdPartyService } from 'ibz-service';
import { UIInstall } from 'ibz-core';
import { Environment } from '@/environments/environment';
import { App } from '@/core';

/**
 * AuthGuard net 对象
 * 调用 getInstance() 获取实例
 *
 * @class AuthGuard
 */
export class AuthGuard {

    /**
     * 获取 Auth 单例对象
     *
     * @static
     * @returns {AuthGuard}
     * @memberof AuthGuard
     */
    static getInstance(): AuthGuard {
        if (!AuthGuard.auth) {
            AuthGuard.auth = new AuthGuard();
        }
        return this.auth;
    }

    /**
     * 单例变量声明
     *
     * @private
     * @static
     * @type {AuthGuard}
     * @memberof AuthGuard
     */
    private static auth: AuthGuard;

    /**
     * 应用对象
     *
     * @private
     * @static
     * @type {App}
     * @memberof AuthGuard
     */
    private application: App = App.getInstance();

    /**
     * 执行钩子(包含获取租户前、获取租户后、获取应用数据前、获取应用数据后)
     *
     * @memberof AuthGuard
     */
    public static hooks = new AppHooks();

    /**
     * 第三方服务
     *
     * @type {ThirdPartyService}
     * @memberof AuthGuard
     */
    public thirdPartyService:ThirdPartyService = ThirdPartyService.getInstance();

    /**
     * Creates an instance of AuthGuard.
     * 私有构造，拒绝通过 new 创建对象
     *
     * @memberof AuthGuard
     */
    private constructor() { }

    /**
     * 获取应用数据
     *
     * @param {string} url url 请求路径
     * @param {*} [params={}] 请求参数
     * @param {*} [router] 路由对象
     * @returns {Promise<any>} 请求相响应对象
     * @memberof AuthGuard
     */
    public async authGuard(url: string, params: any = {}, router: any): Promise<boolean> {
        if (this.application.getContext()) {
            return true;
        }
        this.initAppPlatForm();
        if (Environment && Environment.SaaSMode) {
            if (getSessionStorage('activeOrgData')) {
                return await this.getAppData(url, params, router);
            } else {
                let result: any = await this.getOrgsByDcsystem(router);
                if (!result) {
                    await this.initAppService(router);
                    return false;
                } else {
                    return await this.getAppData(url, params, router);
                }
            }
        } else {
            return await this.getAppData(url, params, router);
        }
    }

    /**
     * 获取应用数据
     *
     * @param {string} url url 请求路径
     * @param {*} [params={}] 请求参数
     * @param {*} [router] 路由对象
     * @returns {Promise<boolean>} 是否通过
     * @memberof AuthGuard
     */
    public async getAppData(url: string, _params: any = {}, router: any): Promise<boolean> {
        if (Environment.enableAppData) {
            try {
                AuthGuard.hooks.beforeGetAppData.callSync({ arg: { url: url, param: _params } });
                const response: any = await Http.getInstance().get(url);
                if (response && response.status === 200) {
                    let { data }: { data: any } = response;
                    AuthGuard.hooks.afterGetAppData.callSync({ arg: { data: data } });
                    if (data) {
                        // token认证把用户信息放入应用级数据
                        if (getCookie('ibzuaa-user')) {
                            let user: any = JSON.parse(getCookie('ibzuaa-user') as string);
                            let localAppData: any = {};
                            if (user.sessionParams) {
                                localAppData = { context: user.sessionParams };
                                Object.assign(localAppData, data);
                            }
                            data = JSON.parse(JSON.stringify(localAppData));
                        }
                        this.application.setContext(data?.context);
                        this.application.setAuthResData(data?.unires);
                    }
                    return await this.initAppService(router);
                }
                await this.initAppService(router);
                this.doNoLogin(router);
                return false;
            } catch (error) {
                await this.initAppService(router);
                return false;
            }
        } else {
            return await this.initAppService(router);
        }
    }

    /**
     * 通过租户获取组织数据
     *
     * @memberof AuthGuard
     */
    public async getOrgsByDcsystem(_router: any): Promise<boolean> {
        let tempViewParam = this.hanldeViewParam(window.location.href);
        if (!tempViewParam.srfdcsystem) {
            if (!tempViewParam.redirect) {
                if (getSessionStorage('dcsystem')) {
                    tempViewParam = getSessionStorage('dcsystem');
                }
            } else {
                tempViewParam = this.hanldeViewParam(tempViewParam.redirect);
            }
        }
        if (!tempViewParam.srfdcsystem && Environment.mockDcSystemId) {
            Object.assign(tempViewParam, { srfdcsystem: Environment.mockDcSystemId });
        }
        if (tempViewParam.srfdcsystem) {
            AuthGuard.hooks.beforeDcSystem.callSync({ arg: { dcsystem: tempViewParam.srfdcsystem } });
            setSessionStorage('dcsystem', tempViewParam);
            let requestUrl: string = `/uaa/getbydcsystem/${tempViewParam.srfdcsystem}`;
            const response: any = await Http.getInstance().get(requestUrl);
            if (response && response.status === 200) {
                let { data }: { data: any } = response;
                AuthGuard.hooks.afterDcSystem.callSync({ arg: { dcsystem: tempViewParam.srfdcsystem, data: data } });
                if (data && data.length > 0) {
                    setSessionStorage('orgsData', data);
                    setSessionStorage('activeOrgData', data[0]);
                }
                return true;
            } else {
                return false;
            }
        } else {
            // TODO
            // this.doNoLogin(_router);
            return true;
        }
    }

    /**
     * 初始化应用服务
     *
     * @param {*} [router] 路由对象
     *
     * @memberof AuthGuard
     */
    public async initAppService(router: any): Promise<any> {
        try {
            const service = new AppModelService();
            await GlobalHelp.install(service, async (strPath: string, config: DynamicInstanceConfig) => {
                let url: string = '';
                if (Environment.bDynamic) {
                    url = `${Environment.remoteDynaPath}${strPath}`;
                    if (config) {
                        url += `?srfInstTag=${config.instTag}&srfInstTag2=${config.instTag2}`;
                    }
                } else {
                    url = `./assets/model${strPath}`;
                }
                try {
                    const result: any = await Http.getInstance().get(url);
                    return result.data ? result.data : null;
                } catch (error) {
                    return null;
                }
            }, { lang: '' });
            this.application.setModel(service.app);
            this.application.setEnvironment(Environment);
            UIInstall(this.application);
            ServiceInstall(this.application);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 初始化搭载平台
     *
     * @memberof AuthGuard
     */
    public async initAppPlatForm() {
        let platform: 'ios' | 'android' | 'dd' | 'wx-sp' | 'wx-pn' | 'desktop' | 'web' = "web";
        const info: string = window.navigator.userAgent.toUpperCase();
        // 钉钉
        if (info.indexOf('DINGTALK') !== -1) {
            platform = 'dd';
        }
        // 微信小程序
        else if (info.indexOf('WECHART') !== -1) {
            platform = 'wx-sp';
        }
        // 桌面端
        else if (info.indexOf('ELECTRON') !== -1) {
            platform = 'desktop';
        }
        // 微信公众号
        else if (info.indexOf('MICROMESSENGER') !== -1) {
            platform = 'wx-pn';
        }
        // 安卓应用
        else if (info.indexOf('ANDROID') !== -1) {
            platform = 'android';
        }
        // 苹果应用 (未测试)
        // else if (info.indexOf('IPHONE') !== -1) {
        //     platform = 'ios';
        // }
        this.application.setPlatFormType(platform);
        if (Object.is(platform, 'dd') || Object.is(platform, 'wx-sp') || Object.is(platform, 'wx-pn')) {
             await this.thirdPartyService.login();
        }
    }

    /**
     * 处理路径数据
     *
     * @param {*} [urlStr] 路径
     *
     * @memberof AuthGuard
     */
    public hanldeViewParam(urlStr: string): any {
        let tempViewParam: any = {};
        const tempViewparam: any = urlStr.slice(urlStr.indexOf('?') + 1, urlStr.indexOf('#'));
        const viewparamArray: Array<string> = decodeURIComponent(tempViewparam).split(';');
        if (viewparamArray.length > 0) {
            viewparamArray.forEach((item: any) => {
                Object.assign(tempViewParam, qs.parse(item));
            });
        }
        return tempViewParam;
    }

    /**
     * 处理未登录异常情况
     *
     * @memberof AuthGuard
     */
    public doNoLogin(router: any) {
        this.application.onClearAppData();
        if (Environment.loginUrl) {
            window.location.href = `${Environment.loginUrl}?redirect=${window.location.href}`;
        } else {
            if (Object.is(router.currentRoute.name, 'login')) {
                return;
            }
            router.push({ name: 'login', query: { redirect: router.currentRoute.fullPath } });
        }
    }
}
