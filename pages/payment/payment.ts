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
    tt.request({
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
        tt.showToast({
          title: '请选择您要充值的花花数目',
          icon: 'none',
        });
        return;
      }
      const price = selectedRechargeOption.price;
      console.log("用户发起支付，支付金额:", price);
      tt.request({
        url: `${apiBaseUrl}/api/payment/order/douyin`,
        method: 'POST',
        header: {
          access_token: userToken,
        },
        data: {
          pay_type: 'douyin',
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
            const orderInfo = JSON.parse(data.message);
            //
            //  "data": {
            //      "order_id": "N6819903302604491021",
            //      "order_token": "CgwIARDiDRibDiABKAESTgpMbBhsCG7V1MPGAvpICgUSyGcuNOVb/BnCOi9EXgAxIxDqLTwCA6Hd3tNrCde28o0qjmAJQsmLrD18ifr5QktalszSSmTpHCqEm3h55xoA"
            //    }
            //
            
            tt.pay({
              orderInfo: orderInfo,
              service: 5,
              success(res) {
                if (res.code == 0) {
                  // 支付成功处理逻辑，只有res.code=0时，才表示支付成功
                  // 但是最终状态要以商户后端结果为准
                  console.log("支付成功");
                }
              },
              fail(res) {
                // 调起收银台失败处理逻辑
                console.log("支付失败");
              },
            });
            
            } else {
              console.error('Failed to place order:', res);
            }
        
        },
        fail: (res) => {
          console.log('Failed to get prepay order:', res);
        }
      });
  },
});
