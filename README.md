# sync-storage-listener
### 跨页存储的同步监听方案 *Synchronization listening scheme for cross page storage*

### 它能解决什么？ *What can it solve？*


* 监听cookie/sessionStroage/localStorage变化
* 多页面同步监听变化
* Listen for Cookie / sessionsload / localstorage changes
* Multi page synchronous monitoring changes

### 例子 *example*
* 非同源页面sessionStorage无法共享
* 多页面操作，状态无法同步
* 无法监听cookie变化
* Session storage of non homologous pages cannot be shared
* Multi page operation, status cannot be synchronized
* Unable to listen for cookie changes

### 生成版本*build version*
    $ npm run build

### 如何安装 *How to install*
    $ npm install sync-storage-listener
    
### 如何使用 *How to use*
    
    <script src="./dist/sync-storage-listener.min.js"></script>
    import Storage from 'sync-storage-listener'

    Storage.init(config)
    Storage.ready().then(() => {
      // to do something
    })
### 支持Vue
    import Storage from 'sync-storage-listener'
    Vue.use(Storage, config)
    this.$storage.ready().then(() => {
      // to do something
    })

### 配置 *config*


    {
       mountKey:string,//Vue挂载符,默认为：$storage
       enable:boolean,//是否开启跨页面同步监听
       prefix：string,//前缀符,默认为：cps
       storageType：'sessionStorage'，//还可设置为localStorage/cookie
       related:string|Array<string>,//指定同步数据 
       callback:function,//同步数据回调
       listener:object|Array<object>,//指定数据回调
       timeout:number //请求超时时长,默认为30ms 单位:ms
       refeshEmit:boolean,//同步后刷新页面是否触发一次监听
       filterInvalid:boolean,//是否过滤同样数据
    }


#### config.callback

    function(keys,vals,type,Storage){
      // keys:Array 
      // vals:Array 
      // tyep:request|set|remove
      // Storage:this 
    }
    
#### config.listener

    {
      key:string,
      callback:function
    }
    // 支持数组
    [{
      key:string,
      callback:function
    },{
      key:string,
      callback:function
    }]

#### config.listener.callback
    function(val,key,type,Storage){
      // key:string
      // val:string
      // tyep:request|set|remove
      // Storage:this 
    }

### 示例*example*
    //监听token变化
    {
       mountKey:'$storage',
       enable:true,
       prefix：'cps',
       storageType：'sessionStorage'，
       callback(keys){
         if(keys.includes('token')console.log('监听到了变化!')
       },
       listener:{
         key:'token',
         callback(){
           console.log('监听到了变化!')
         }
       }
    }
### Api
#### Storage.setItem()

    Storage.setItem(key:string,value:any,expire:number)
    Storage.setItem({key,value,expire})
    Storage.setItem([{key,value,expire},{key,value,expire}])
    // expire 过期时间,仅storageType为localStorage/cookie时有效 
    // 单位为：小时/hour

##### 示例*example*
    Storage.setItem('token',{userName:'jojo'},3)
    Storage.setItem({key:'token',value:{userName:'jojo'},expire:3})
    Storage.setItem([{key:'token',value:{userName:'jojo'},expire:3},{key:'some',value:{other:'nono'}}])
    
#### Storage.getItem()
    Storage.getItem(key:string):any
    Storage.getItem([key1,key2]):[val1,val2]

##### 示例*example*
    Storage.getItem('token') //return {userName:'jojo'}
    Storage.getItem(['token','some']) //return [{userName:'jojo'},{other:'nono'}]

#### Storage.removeItem()
    Storage.removeItem(key:string)
    Storage.removeItem([key1,key2])

##### 示例*example*
    Storage.removeItem('token')
    Storage.removeItem(['token','some'])

#### Storage.clear()
    Storage.clear()

#### Storage.ready()
    Storage.ready():Promise //同步完成 

##### 示例*example*
    Storage.ready().then(() => { // to do something })