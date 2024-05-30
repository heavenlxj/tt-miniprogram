const app = getApp();
import md5 from '../../utils/md5'; 
Page({
  // 初始化数据，假设未登录状态
  data: {
    apiBaseUrl: app.globalData.apiBaseUrl,
    isLogged: false,
    userInfo: {
      avatarUrl: '/images/login/avatar.jpg', // 默认头像图片路径
      nickName: '未登录',
      userId: 'xxx',
    },
    workList: [], // 存储作品列表数据
    // workList: [
    //   {
    //     id: 1,
    //     scenario_name: '换脸达人',
    //     image: '/images/scenarios/image1.jpg', // 示例图片路径
    //     updated_time: '2023-07-11 00:03:00',
    //   },
    //   {
    //     id: 2,
    //     scenario_name: '换脸达人',
    //     image: '/images/scenarios/image2.jpg', // 示例图片路径
    //     updated_time: '2023-07-12 00:03:00',
    //   },
    //   {
    //     id: 3,
    //     scenario_name: '换脸达人',
    //     image: '/images/scenarios/image1.jpg', // 示例图片路径
    //     updated_time: '2023-07-13 00:03:00',
    //   },
    //   // 更多作品数据...
    // ],
  },
  
  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });

    // 调用接口获取用户的作品列表
    this.fetchUserWorkList();
  },

  fetchUserWorkList() {
    const { apiBaseUrl, userInfo } = getApp().globalData;
    //const userId = userInfo.openid;
    //const userId = userInfo.openid;
    const userId = 'xxx';
    wx.request({
      url: `${apiBaseUrl}/api/images/users/${userId}/_generated`,
      method: 'GET',
      success: (res) => {
        const respWorkList = res.data.map(item => ({
          ...item,
          url: this.data.apiBaseUrl + item.url,
        }));

        this.setData({
          workList: respWorkList,
        });
      },
      fail: (error) => {
        console.error('Error fetching user work list:', error);
      },
    });
  },

  // 点击登录按钮的事件处理函数
  onLoginTap: function () {
    // 此处实现跳转到微信登录页面的逻辑，暂时不处理
    console.log('跳转到微信登录页面');
    // 假设登录成功后获取到用户信息，更新data中的userInfo
    this.setData({
      isLogged: true,
      userInfo: {
        avatarUrl: '/images/login/avatar.jpg',
        nickName: '用户昵称',
        userId: '用户ID',
      }
    });
  },

  // 点击会员充值按钮的事件处理函数，跳转到会员充值页面
  onRechargeTap: function () {
    wx.navigateTo({
      url: '/pages/recharge/recharge',
    });
  },

  // 点击作品卡片的事件处理函数，跳转到作品详情页面
  onWorkCardTap: function (event) {
    const workImage = event.currentTarget.dataset.workImage;

    wx.previewImage({
      urls: [workImage],
      current: workImage,
    });
  },

  // 生成随机字符串
  generateNonceStr(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  },

  // 生成签名
  generateSign(params) {
    const app_key = "A9b3RtY6sWq1Fg2HjLp4ZxC8vBn7M3kb";
    const stringA = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== '')
      .sort()
      .map(key => key + '=' + params[key])
      .join('&');
    const stringSignTemp = stringA + '&key='+ app_key; // 替换为您的商户支付密钥
    const sign = md5(stringSignTemp).toUpperCase();
    return sign;
  },

  pay: function () {
    wx.login({
      success: (res) => {
        const { userInfo } = getApp().globalData;
        if (res.code) {
          // 调用后端接口获取预支付订单信息
          wx.request({
            url: 'http://127.0.0.1:8085/unifiedorder',
            method: 'POST',
            data: {
              total_fee: 1, // 订单金额，单位：分
              body: 'Your Order Description',
              openid: userInfo.openid, // 用户的openid
              trade_type: 'JSAPI',
            },
            success: (res) => {
              const data = res.data.xml;
              console.log('####data:', data);
              if (data.return_code === 'SUCCESS' && data.result_code === 'SUCCESS') {
                const timeStamp = String(Math.floor(Date.now() / 1000)); // 当前时间戳
                const nonceStr = this.generateNonceStr(32); // 生成随机字符串
                const packageStr = 'prepay_id=' + data.prepay_id; // 订单详情扩展字符串
                const signType = 'MD5'; // 签名类型

                // 构造签名
                const signParams = {
                  appId: data.appid,
                  timeStamp: timeStamp,
                  nonceStr: nonceStr,
                  package: packageStr,
                  signType: signType
                };
                const paySign = this.generateSign(signParams);

                // 调起支付
                wx.requestPayment({
                  timeStamp: timeStamp,
                  nonceStr: nonceStr,
                  package: packageStr,
                  signType: signType,
                  paySign: paySign,
                  success: (res) => {
                    console.log('Payment success:', res);
                  },
                  fail: (res) => {
                    console.log('Payment failed:', res);
                  }
                });
              } else {
                console.error('Failed to place order:', data.return_msg);
              }
            },
            fail: (res) => {
              console.log('Failed to get prepay order:', res);
            }
          });
        } else {
          console.log('Login failed:', res);
        }
      },
      fail: (res) => {
        console.log('Login failed:', res);
      }
    });
  },

});