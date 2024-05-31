// scenario.ts
const app = getApp();

interface VideoStyle {
  image: string;
  name: string;
  key: string;
  type: string;
  workflow_version: string;
}

interface VideoDuration {
  text: string,
  value: number
}

Page({
  data: {
    flowerCost: 4.5,
    flowerUserOwned: null,
    show: false,
    animation: {},
    uploading: false, // 标记是否正在上传中
    uploadedVideo: '', // 上传完成后的视频地址
    cameraOpened: false, // 标记相机是否已打开
    uploadedThumbnail: '', // 上传视频的第一帧图片路径
    showPopup: false, // 是否显示风格选择弹窗
    selectedStyle: null, // 当前选择的视频风格
    videoStyles: [] as VideoStyle[], // 视频风格列表
    durations: [] as VideoDuration[],
    selectedDuration: 3, // 选择的视频时长
    scrollHeight: 0, // scroll-view的高度,
    apiBaseUrl: app.globalData.apiBaseUrl,
  },

  onLoad: function() {
    // 初始化视频风格列表等数据
    this.setData({
      videoStyles: [
        {
          image: '/images/video/anime1.png',
          name: '动画风格1',
          key: 'Animate1',
          type: 'rainbowsweets_v20.safetensors',
          workflow_version: 'v7'
        },
        {
          image: '/images/video/clay.jpg',
          name: '粘土动画风格',
          key: 'Clay',
          type: 'disneyPixarCartoon_v10.safetensors',
          workflow_version: 'clay'
        },
        {
          image: '/images/video/anime2.png',
          name: '动画风格2',
          key: 'Animate2',
          type: 'default',
          workflow_version: 'v7'
        },
        {
          image: '/images/video/disney.png',
          name: '迪士尼风格',
          key: 'Disney',
          type: 'disney',
          workflow_version: 'v7'
        },
        {
          image: '/images/video/25d.png',
          name: '2.5D风格',
          key: '25d',
          type: 'majicmixFantasy_v30Vae.safetensors',
          workflow_version: 'v7'
        },
        {
          image: '/images/video/real.png',
          name: '真人风格',
          key: 'real',
          type: 'majicmixRealistic_v7.safetensors',
          workflow_version: 'v7'
        }
      ],
      durations: [
        {
        text: '3s',
        value: 3
        }, 
      {
        text: '5s',
        value: 5
      }, 
      { text: '10s',
        value: 10
      }, 
      { 
        text:'20s',
        value: 20
      }, 
    { 
      text: '30s',
      value: 30
    }, 
    {
      text: '1min',
      value: 60
    }]
    });
    const query = wx.createSelectorQuery();
    query.select('.selection-box').boundingClientRect(rect => {
      this.setData({ scrollHeight: rect.height });
    }).exec();

    //获取用户的credits
    this.getUserCredits();
  },

  // 点击上传视频
  onUploadVideo: function () {
    this.setData({
      uploading: true,
    });
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      compressed: true,
      maxDuration: 60, // 最大选择时长为60秒
      success: (res) => {
        this.setData({
          uploadedVideo: res.tempFilePath,
          uploadedThumbnail: res.thumbTempFilePath,
          cameraOpened: true,
          uploading: false,
        });
      },
      fail: (err) => {
        console.error('选择视频失败:', err);
        this.setData({
          uploading: false,
        });
      }
    });
  },
  onCameraStop() {
    // 相机停止时触发的事件
    this.setData({
      cameraOpened: false,
    });
  },

  closeUploadedVideo() {
    // 关闭上传完成后的视频预览
    this.setData({
      uploadedVideo: '',
      cameraOpened: false,
    });
  },

  // 显示风格选择弹窗
  showStyleSelectionPopup: function () {
    this.setData({
      showPopup: true,
    });
  },

  // 选择视频风格
  selectStyle(e) {
    const index = e.currentTarget.dataset.index;
    const selectedStyle = this.data.videoStyles[index];
    this.setData({ selectedStyle, show: false });
  },

  selectDuration: function (event: any) {
    const duration = event.currentTarget.dataset.duration;
    this.setData({
      selectedDuration: duration
    })
    console.log('选择时长:', duration);
     // 更新花花消耗值
    this.calculateFlowerConsumption();
  },

  async onGenerateVideo () {
    // 处理生成视频逻辑
    console.log('生成视频');
    const { uploadedVideo, selectedStyle } = this.data;
    const userToken=app.globalData.userToken;
    console.log("Video user Token:", userToken);
    if (!uploadedVideo) {
      wx.showToast({
        title: '请先上传视频',
        icon: 'none',
      });
      return;
    }

    if (!selectedStyle) {
      wx.showToast({
        title: '请选择视频风格',
        icon: 'none',
      });
      return;
    }

    // 发送视频文件、选定风格、和提示信息到后端生成视频
    wx.showLoading({
      title: '视频生成中...',
    });

    const videoData = await this.callGenVideoApi(
      userToken, 
      this.data.uploadedVideo,
      this.data.selectedStyle,
      this.data.selectedDuration);
  
    console.log("视频生成任务提交完成, video id: "+ videoData)

  },

  calculateFlowerConsumption: function() {
    const selectedDuration = this.data.selectedDuration;
    const flowerConsumption = 1.5 * selectedDuration; // 假设1秒钟消耗1.5花花
    this.setData({
      flowerCost: flowerConsumption.toFixed(2) // 保留两位小数
    });
  },
  

  callGenVideoApi(userToken: string,uploadedVideo: string, selectedStyle: VideoStyle, selectedDuration: number) {
    return new Promise((resolve, reject) => {
      const apiUrl = `${this.data.apiBaseUrl}/api/video/style-trans`;
      console.log("userToken:", userToken);
      console.log("uploadedVideo", uploadedVideo);
      console.log("selectedStyle", selectedStyle);
      console.log("selectedDuration", selectedDuration);
      
      wx.uploadFile({
        url: apiUrl,
        filePath: uploadedVideo,
        name: 'file',
        header: {
          access_token: userToken
        },
        formData: {
          style: selectedStyle.type,
          seconds: selectedDuration,
          version: 'LATEST',
          workflow_version: selectedStyle.workflow_version,
        },
        success: res => {
          const data = JSON.parse(res.data);
          console.log("Submit Task response:", data);
          if (data.status === 'ok') {
            // 视频生成成功
            const videoId = data.video_id; // 获取视频任务id
            console.log("视频任务提交成功", videoId)
            this.navigateToUserPage();
          } else if (
            res.statusCode == 402 &&
            data.status === 'error' &&
            data.message === 'Insufficient credits' ) {
              console.log("用户credits不足");
              wx.showToast({
                title: '您的花花余额不足,请前往我的->充值页面进行充值',
                icon: 'none',
                duration: 3000,
              });
            } else {
            // 视频生成失败
            wx.showToast({
              title: '视频生成失败，请重试',
              icon: 'none',
              duration: 2000,
            });
          }
        },
        fail: error => {
          console.error('Failed to generate video:', error);
          wx.showToast({
            title: '视频生成失败，请重试',
            icon: 'none',
            duration: 2000,
          });
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    })
  },

  popup() {
    this.setData({ show: true });
    const animation = tt.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    });
    animation.translateY(0).step();
    this.setData({
      animation: animation.export(),
    });
  },

  exit() {
    this.setData({ show: false });
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
            flowerUserOwned: resData.credit_value
          });
        }
        },
        fail: (res) => {
          console.log("获取用户贵credits失败");
        }
      }
    );
  },



 
   genVideo2() {

    const showContent = `生成该视频预计会消耗几分钟的时间,视频生成成功后将会从您的账户中扣除${this.data.flowerCost}花花额度, 成功后可以前往我的页面查看结果, 确定当前的操作吗?`;

    wx.showModal({
      title: '提示',
      content: showContent,
      success: (res) => {
        if (res.confirm) {
          // 用户点击了确认按钮
          this.onGenerateVideo();

        } else if (res.cancel) {
          // 用户点击了取消按钮
          // 可以选择执行一些其他操作，或者不执行任何操作
          console.log("取消按钮");
        }
      }
    });
  },



  navigateToUserPage() {
    wx.showToast({
      title: '视频任务提交成功，请前往“我的”页面查看视频生成结果',
      icon: 'none',
      duration: 3000,
      success: () => {
        wx.setStorageSync('selectedTab', 0); // 将需要的参数保存到本地缓存中
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/user/index', // 使用 switchTab 跳转到 "我的" 页面
          });
        }, 2000); // 2秒后跳转到新页面
      }
    });
  }
});
