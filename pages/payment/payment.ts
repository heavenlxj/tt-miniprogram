// index.js
import md5 from '../../utils/md5'; 
const app = getApp();

Page({
  data: {
    appId: 'wx15daec1f510897c4',
    balance: 0, // 用户金币余额
    icon: '/images/pay/flower.png',
    rechargeOptions: [ // 充值选项
      { amount: 10, price: 10 },
      { amount: 20, price: 20 },
      { amount: 50, price: 50 },
      {  amount: 100, price: 100 },
      { amount: 200, price: 200 },
      { amount: 500, price: 500 },
      { amount: 1000, price: 1000 },
    ],
    // 用户选择的充值选项
    selectedRechargeOption: null,
    apiBaseUrl: app.globalData.apiBaseUrl,
  },

  onLoad() {
    this.getUserCredits();
  },

  goToHelp() {
    // 跳转到帮助页面
  },
  goToPurchaseHistory() {
    // 跳转到购买记录页面
  },
  // 选择充值选项
  selectRechargeOption(event) {
    const index = event.currentTarget.dataset.index;
    const { rechargeOptions, selectedRechargeOption } = this.data;
    const selectedOption = rechargeOptions[index];
    
    // 如果用户选择了之前未选中的选项，则更新选中状态和记录用户选择的选项
    if (!selectedOption.selected) {
      rechargeOptions.forEach((option, idx) => {
        if (idx === index) {
          option.selected = true;
        } else {
          option.selected = false;
        }
      });
      console.log("选中了:", selectedOption);

      this.setData({
        rechargeOptions,
        selectedRechargeOption: selectedOption,
      });
    }
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

  getUserCredits() {
    const userToken=app.globalData.userToken;
    const { apiBaseUrl } = this.data;
    wx.request({
        url: `${apiBaseUrl}/api/credits`,
        header:{
          access_token: userToken,
        },
        success: (res) => {
          const resData = res.data;
          if (resData) {
          console.log("获取用户credits:", resData);
          this.setData({
            balance: resData.credit_value
          });
        }
        },
        fail: (res) => {
          console.log("获取用户贵credits失败");
        }
      }
    );
  },

  pay: function () {
      // 调用后端接口获取预支付订单信息
      const {selectedRechargeOption, apiBaseUrl, appId } = this.data;
      const userToken=app.globalData.userToken;
      const openId = app.globalData.openid;
      if (!selectedRechargeOption) {
        console.log("请选择支付的金额");
        wx.showToast({
          title: '请选择您要充值的花花数目',
          icon: 'none',
        });
        return;
      }
      const price = selectedRechargeOption.price;
      console.log("用户发起支付，支付金额:", price);
      wx.request({
        url: `${apiBaseUrl}/api/payment/order`,
        method: 'POST',
        header: {
          access_token: userToken,
        },
        data: {
          pay_type: 'jsapi',
          amount: price,
          payer: openId,
        },
        success: (res) => {
          if (res.statusCode == 401) {
            console.log("未授权");
            return;
          } else if (res.statusCode == 200) {
            const data = res.data;
            console.log('####data:', data);
            const rawData = JSON.parse(data.message);
            if (rawData.prepay_id) {
              const prepay_id = rawData.prepay_id;
              const timeStamp = String(Math.floor(Date.now() / 1000)); // 当前时间戳
              const nonceStr = this.generateNonceStr(32); // 生成随机字符串
              const packageStr = 'prepay_id=' + prepay_id; // 订单详情扩展字符串
              const signType = 'RSA'; // 签名类型
              let paySign = '';
              // 请求签名
              wx.request({
                  url: `${apiBaseUrl}/api/payment/sign`,
                  method: 'POST',
                  header: {
                    access_token: userToken,
                  },
                  data: {
                    app_id: appId,
                    time_stamp: timeStamp,
                    nonce: nonceStr,
                    package: packageStr
                  },
                  success: (res) => {
                    if (res.statusCode != 200) {
                      console.log("生成签名失败");
                      return;
                    }
                    console.log("生成签名成功");
                    paySign = res.data.data;
                    // 调起支付
                    wx.requestPayment({
                      timeStamp: timeStamp,
                      nonceStr: nonceStr,
                      package: packageStr,
                      signType: signType,
                      paySign: paySign,
                      success: (res) => {
                        console.log('Payment success:', res);
                        wx.showToast({
                          title: '支付成功',
                          icon: 'none',
                        });
                        return;
                      },
                      fail: (res) => {
                        console.log('Payment failed:', res);
                      }
                    });
                  },
                  fail: (res) => {
                    console.log("签名失败");
                    return;
                  }
                }
              )
            
            } else {
              console.error('Failed to place order:', data);
            }
        }
        },
        fail: (res) => {
          console.log('Failed to get prepay order:', res);
        }
      });
  },
});
