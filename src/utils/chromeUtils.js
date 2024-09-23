export const storage={
  /**
   * @description 获取存储
   * @param {*} key 
   */
  async get(key){
    const data = (await chrome.storage.local.get()) || {};
    if (!key) return data;
    return data[key];
  },
  /**
   * @description 设置存储
   * @param {*} key 
   * @param {*} value 
   */
  async set(key,value){
    const data = await storage.get();
    await chrome.storage.local.set({...data,[key]:value});
  },
  /**
   * @description 清除存储
   * @param {*} key 
   */
  async clear(key){
    await chrome.storage.local.clear(key)
  }

}
/**
 * @description cookie相关方法
 */
export const cookies={
  /**
   * @description 获取所有cookie
   * @param {*} details 
   */
  async getAll(url){
    return new Promise((resolve)=>{
      chrome.cookies.getAll({url:url},(details)=>{
       // 将数组转换为对象
        const cookies = details.reduce((prev, current) => {
          prev[current.name] = current.value;
          return prev;
        }, {});
        resolve(cookies)
      })
    })
  },
  /**
   * @description 设置cookie
   * @param {*} details 
   */
  async set(details){
    return new Promise((resolve)=>{
      chrome.cookies.set(details,resolve)
    })
  },
  /**
   * @description 移除cookie
   * @param {*} details 
   */
  async remove(details){
    return new Promise((resolve)=>{
      chrome.cookies.remove(details,resolve)
    })
  },
  /**
   * @description 移除所有cookie
   * @param {*} details 
   */
  async removeAll(details){
    return new Promise((resolve)=>{
      chrome.cookies.removeAll(details,resolve)
    })
  }
}
/**
 * @description 页签相关方法
 */
export const tabsQuery={
  getTabsQuery(){
    return new Promise((resolve)=>{
      chrome.tabs.query({active: true, currentWindow: true},(tabs)=>{
        if(tabs.length>0) resolve(tabs[0])
      })
    })
  }
}
