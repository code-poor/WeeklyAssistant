import axios from 'axios';
import * as browserUtils from './chromeUtils';
// 创建axios实例
const instance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' }
});


/**
 * @description 请求拦截器
 */
instance.interceptors.request.use(async (config)=> {
  // 获取当前页面数据
  const tabsQuery = await browserUtils.tabsQuery.getTabsQuery();
  // 获取当前网站的cookie
  const cookie = await browserUtils.cookies.getAll(tabsQuery.url);
  config.headers.cookie = Object.keys(cookie).map(key => `${key}=${cookie[key]}`).join(';');
  return config;
});
instance.interceptors.response.use((response) => {
  return response;
}, (error) => {
  return Promise.reject(error);
});
export default instance;