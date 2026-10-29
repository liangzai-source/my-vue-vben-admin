import { useAccessStore } from '@vben/stores';

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    account?: string;
    password?: string;
    captcha?: boolean;
    username?: string;
    remember_me?: boolean;
  }

  /** 登录/刷新 Token 接口返回值 */
  export interface LoginResult {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    user?: any;
    userType?: number;
  }

  export interface RefreshTokenResult {
    code: number;
    data: LoginResult;
    message: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(refreshToken?: string) {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/auth/refresh-token',
    {
      refresh_token: refreshToken,
    },
  );
}

/**
 * 退出登录
 * 采用 baseRequestClient：
 * 1. 本地若有 token 则手动携带传递给后端，以便服务端吊销会话；
 * 2. 即使 token 已失效，也不会触发 401 自动刷新或错误弹窗，确保永远顺畅退出到登录页。
 */
export async function logoutApi() {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  return baseRequestClient.post('/auth/logout', undefined, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.post<string[]>('/auth/auth-code');
}
