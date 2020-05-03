declare module 'sync-storage-listener' {
    class Storage {
        static ready():Promise<null>
        static clear():void
        static getItem(key:string):any
        static getItem(key:string[]):[any]
        static removeItem(key:string):void
        static removeItem(key:string[]):void
        static setItem(key:string,value:any,expire?:number):void
        static setItem(key:{key:string,value:any,expire?:number}|Array<{key:string,value:any,expire?:number}>):void
        static init(config:{
            mountKey?:string
            storageType?:'sessionStorage'|'localStorage'|'cookie',
            related?:string|string[],
            enable?:boolean,
            filterInvalid?:boolean,
            refeshEmit?:boolean,
            prefix?:string,
            listener?:{
                key:string,
                callback:(val:Array<any>,key:Array<string>,type:string,Storage:Storage)=>void
            }|Array<{
                key:string,
                callback:(val:Array<any>,key:Array<string>,type:string,Storage:Storage)=>void
            }>
            callback?:(key:Array<string>,value:Array<any>,type:string,Storage:Storage)=>void,
            timeout?:number
        }):null
    }
    export default Storage    
  }