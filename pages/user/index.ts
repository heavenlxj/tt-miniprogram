
const app = getApp();

interface WorkItem {
  id: string;
  user_id: string;
  task_id: string;
  image_url: string;
  video_url: string;
  fc_name: string;
  url: string;
  status: string;
  created_at: string;
}

const tabList = [ {
  id: 'video',
  name: '视频',
}]

Page({
  data: {
    loadingMore: false, // 用于标识是否正在加载更多视频数据
    currentPage: 1, // 当前加载的视频页码
    apiBaseUrl: app.globalData.apiBaseUrl,
    tabList,
    selectedTab: 0,
    scrollTopOuter: 0,
    scrollIntoViewInner1: '',
    scrollIntoViewInner2: '',
    refresherTriggered: false,
    refreshOnce: false,
    workList: [], // 作品列表数据,
  },

    onTapTab(evt) {
      this.setData({
        selectedTab: +evt.currentTarget.dataset.index,
      })

      if (+evt.currentTarget.dataset.index === 0) { // 点击视频tab时触发懒加载
         this.fetchVideoList(1, 5)
         .then((newVideos) => {
          if (newVideos.length > 0) {
            this.setData({
              'tabList[1].list': newVideos,
            });
          }
        })
        .catch((error) => {
          // 加载失败时处理错误，也要将 loadingMore 置为 false
          console.error('Failed to load more videos:', error);
        })
        
      } 
    },

    onLoad() {
      const selectedTab = tt.getStorageSync('selectedTab') || 0; // 从本地缓存中读取参数，默认为 0
      this.setData({
        selectedTab: parseInt(selectedTab),
      });
      tt.removeStorageSync('selectedTab'); // 跳转后清除本地缓存
      
      this.fetchVideoList(1, 5)
      .then((newVideos) => {
       if (newVideos.length > 0) {
         this.setData({
           'tabList[0].list': newVideos,
         });
       }
     })
     .catch((error) => {
       // 加载失败时处理错误，也要将 loadingMore 置为 false
       console.error('Failed to load more videos:', error);
     })

    },
  
    onChange(evt) {
      this.setData({
        selectedTab: +evt.detail.current,
      })
    },

    scrollOuterTop() {
      this.setData({
        scrollTopOuter: 0,
      })
    },

    onPayment() {
      tt.navigateTo({
        url: '/pages/payment/payment',
      })
    },

    async fetchImageList() {
      try {
        const { apiBaseUrl, userToken, userId } = getApp().globalData;
        tt.request({
          url: `${apiBaseUrl}/api/images/users/${userId}/_generated`,
          method: 'GET',
          header: {
            access_token: userToken,
          },
          success: (res) => {
            const respWorkList: WorkItem[] = res.data.map((item: any) => ({
              ...item,
              url: this.data.apiBaseUrl + item.url,
              created_at: this.formatDateTime(item.created_at),
            }));
            console.log("图片列表:", respWorkList);
            this.setData({
              'tabList[0].list': respWorkList,
            });
          },
          fail: (error) => {
            console.error('Error fetching user work list:', error);
          },
        });

      } catch (error) {
        console.error('Failed to fetch image list:', error);
      }
    },

    async fetchVideoList(page: number, size: number): Promise<WorkItem[]> {
      return new Promise((resolve, reject) => {
      try {
        const { apiBaseUrl, userToken } = getApp().globalData;
        tt.request({
          url: `${apiBaseUrl}/api/svd/videos?page=${page}&size=${size}`,
          method: 'GET',
          header: {
            access_token: userToken,
          },
          success: (res) => {
            const videoList: WorkItem[] = res.data.data;
            console.log("video list:", videoList);
            // 处理视频状态，设置视频地址
            videoList.forEach((item) => {
              if (['running', 'pending', 'enqueued', 'dequeued'].includes(item.status.toLocaleLowerCase())) {
                item.videoUrl = ''; // 如果视频处于队列中，则设置为空视频地址
                item.created_at = this.formatDateTime(item.created_at);
              } else if (item.status.toLocaleLowerCase() === 'succeeded') {
                item.videoUrl = this.data.apiBaseUrl + item.url; // 如果视频处理成功，则设置视频地址
                item.created_at = this.formatDateTime(item.created_at);
                item.status = item.status.toLocaleLowerCase();
              }
            });
            resolve(videoList);
          },
          fail: (error) => {
            console.error('Error fetching user work list:', error);
          },
        });
      } catch (error) {
        console.error('Failed to fetch video list:', error);
      }
    });
  },
    
    onRefresh() {

      console.log("Rerefsh");
      this.setData({
        refresherTriggered: false,
        refreshOnce: true
      })
       if (this.data.selectedTab == 0) {
        console.log("获取视频列表");
        this.fetchVideoList(1,5)
        .then((newVideos) => {
          if (newVideos.length > 0) {
            this.setData({
              'tabList[0].list': newVideos,
            });
          }
        })
      }
    },

  // 加载更多视频数据的方法
  loadMoreVideos() {
    console.log("loadMoreVideos triggered");
    // 标识正在加载更多数据，防止重复加载
    this.setData({
      loadingMore: true,
    });

    // 获取下一页视频数据
    const nextPage = this.data.currentPage + 1;
    console.log("Next Page:", nextPage);
    this.fetchVideoList(nextPage, 5)
      .then((newVideos) => {
        if (newVideos.length > 0) {
          const mergedVideoList = [...this.data.tabList[1].list, ...newVideos];
          // Update the video list and currentPage
          this.setData({
            'tabList[0].list': mergedVideoList,
            currentPage: nextPage,
          });
        }
      })
      .catch((error) => {
        // 加载失败时处理错误，也要将 loadingMore 置为 false
        console.error('Failed to load more videos:', error);
      })
      .finally(() => {
        // Reset loading state
        this.setData({
          loadingMore: false,
        });
      });
    },

    formatDateTime(isoDateTime) {
      const dateTime = new Date(isoDateTime);
      const year = dateTime.getFullYear();
      const month = String(dateTime.getMonth() + 1).padStart(2, '0');
      const day = String(dateTime.getDate()).padStart(2, '0');
      const hours = String(dateTime.getHours()).padStart(2, '0');
      const minutes = String(dateTime.getMinutes()).padStart(2, '0');
      const seconds = String(dateTime.getSeconds()).padStart(2, '0');
      
      return `发布于 ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },


    onShareVideo(event) {
      console.log("分享视频");
      const Url = event.currentTarget.dataset.Url;
      tt.showShareMenu({ // 显示分享菜单
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
      return {
        title: '分享标题',
        path: '/pages/user/index', // 分享页面的路径
        imageUrl: Url,
        success: function () {
          console.log('分享成功');
        },
        fail: function (err) {
          console.log('分享失败:', err);
        }
      };
    },

    previewImage: function (event) {
      const previewImage = event.currentTarget.dataset.previewImage;
      tt.previewImage({
        urls: [previewImage],
        current: previewImage,
      });
    },

    onDownloadVideo(event) {
      const videoUrl = event.currentTarget.dataset.videoUrl; // 获取视频的URL
      tt.showModal({
        title: '下载视频',
        content: '是否下载视频到本地？',
        success: function(res) {
          if (res.confirm) {
            // 用户点击了确定按钮，保存视频到本地相册
            tt.downloadFile({
              url: videoUrl,
              success: function(res) {
                if (res.statusCode === 200) {
                  tt.saveVideoToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: function() {
                      tt.showToast({
                        title: '视频下载成功',
                        icon: 'success',
                        duration: 2000
                      });
                    },
                    fail: function(error) {
                      console.error('保存视频到相册失败：', error);
                      tt.showToast({
                        title: '视频下载失败',
                        icon: 'none',
                        duration: 2000
                      });
                    }
                  });
                } else {
                  console.error('下载视频失败，状态码：', res.statusCode);
                  tt.showToast({
                    title: '视频下载失败',
                    icon: 'none',
                    duration: 2000
                  });
                }
              },
              fail: function(error) {
                console.error('下载视频失败：', error);
                tt.showToast({
                  title: '视频下载失败',
                  icon: 'none',
                  duration: 2000
                });
              }
            });
          }
        }
      });
    }
  
})
