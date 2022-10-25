<template>
  <div>
    <uploader
      :options="options"
      :file-status-text="statusText"
      class="uploader-example"
      ref="uploader"
      :autoStart="false"
      @file-added="onFileAdded"
      @file-complete="fileComplete"
      @complete="complete"
      @file-success="fileSuccess"
    ></uploader>
  </div>

</template>

<script>
  import SparkMD5 from 'spark-md5'
  export default {
    data () {
      return {
        options: {
          target: '//192.168.12.155:8080/ffmpeg-video/upload', // '//jsonplaceholder.typicode.com/posts/',
          testChunks: true,
          checkChunkUploadedByResponse: function (chunk, message) {
            let messageObj = JSON.parse(message)
            if (messageObj.needSkiped) {
              return true
            } else {
              return (messageObj.uploadList || []).indexOf(chunk.offset + 1 + '') >= 0
            }
          }
        },
        attrs: {
          accept: 'image/*'
        },
        statusText: {
          success: '成功了',
          error: '出错了',
          uploading: '上传中',
          paused: '暂停中',
          waiting: '等待中'
        }
      }
    },
    methods: {
      onFileAdded (file) {
        // 计算MD5
        this.computeMD5(file)
      },
      // 计算MD5
      computeMD5 (file) {
        let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
          chunkSize = 2097152,
          chunks = Math.ceil(file.size / chunkSize),
          currentChunk = 0,
          spark = new SparkMD5.ArrayBuffer(),
          fileReader = new FileReader();

        let time = new Date().getTime();

        // console.log('计算MD5...')
        file.cmd5 = true;


        fileReader.onload = (e) => {
          spark.append(e.target.result);   // Append array buffer
          currentChunk++;

          if (currentChunk < chunks) {
            console.log(`第${currentChunk}分片解析完成, 开始第${currentChunk +1} / ${chunks}分片解析`);
            // let percent = Math.floor(currentChunk / chunks * 100);
            // console.log(percent);
            // file.cmd5progress = percent;
            loadNext();
          } else {
            console.log('finished loading');
            let md5 = spark.end();
            console.log(`MD5计算完成：${file.name} \nMD5：${md5} \n分片：${chunks} 大小:${file.size} 用时：${new Date().getTime() - time} ms`);
            spark.destroy(); //释放缓存
            file.uniqueIdentifier = md5; //将文件md5赋值给文件唯一标识
            file.cmd5 = false; //取消计算md5状态
            file.resume(); //开始上传
            console.log(file);
          }
        };

        fileReader.onerror = () => {
          console.warn('oops, something went wrong.');
          file.cancel();
        };

        let loadNext = () =>　{
          let start = currentChunk * chunkSize,
            end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

          fileReader.readAsArrayBuffer(blobSlice.call(file.file, start, end));
        };

        loadNext();
      },
      complete () {
        console.log('complete', arguments)
      },
      fileComplete () {
        console.log('file complete', arguments)
      },
      fileSuccess () {
        this.$axios({
          method: 'post',
          url: 'http://192.168.12.155:8080/ffmpeg-video/upload-success',
          data: arguments[1]
        }).then(response => {
        })
      }
    },
    mounted () {
      this.$nextTick(() => {
        window.uploader = this.$refs.uploader.uploader
      })
    }
  }
</script>

<style>
  .uploader-example {
    width: 880px;
    padding: 15px;
    margin: 40px auto 0;
    font-size: 12px;
    box-shadow: 0 0 10px rgba(0, 0, 0, .4);
  }
  .uploader-example .uploader-btn {
    margin-right: 4px;
  }
  .uploader-example .uploader-list {
    max-height: 440px;
    overflow: auto;
    overflow-x: hidden;
    overflow-y: auto;
  }
</style>
