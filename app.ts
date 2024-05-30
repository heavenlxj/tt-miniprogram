// app.ts
const config = require('./config')

App<IAppOption>({
  globalData: {
    userId: null,
    userCode: null,
    userToken: null,
    openid: null,
    ...config,
    //apiBaseUrl: 'https://api-server-api-server-wcvomnbccr.cn-hangzhou.fcapp-test.run',
  },
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    wx.login({
      success: (res) => {
        if (res.code) {
          console.log("userCode:", res.code)
          this.globalData.userCode = res.code;
          //获取token
          wx.request({
            url:  `${this.globalData.apiBaseUrl}/api/oauth/login`,
            method: 'POST',
            data: {
              auth_type: 'xwx',
              code: res.code,
            },
            success: (res) => {
              const userTokenData = res.data;
              this.globalData.userToken = userTokenData.access_token;
              this.globalData.userId = userTokenData.user.id;
              const auth_info = userTokenData.oauth;
              const openid = auth_info.extra.openid;
              this.globalData.openid = openid;
              console.log("token:", this.globalData.userToken);
              console.log("platform userId:", this.globalData.userId);
              console.log("openid:", this.globalData.openid);
            },
            fail: (error) => {
              console.error(error);
              console.log("请求后端token信息失败");
            },
          });
        } else {
          console.log(res);
          console.log("登录失败:返回信息异常");
        }
      },
      fail: () => {
        console.log("登录失败: wx.login");
      },
    });
  },
});
