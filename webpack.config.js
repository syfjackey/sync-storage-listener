const path = require("path");


module.exports = {
    mode: 'production',
    devtool: 'source-map',
    entry: "./lib/sync-storage-listener.js",
    output: {
        path: path.resolve(__dirname, './dist'),//输出路径，就是新建的dist目录，
        publicPath: '/dist/',
        filename: 'sync-storage-listener.min.js',
        libraryTarget: 'umd',
        library: 'Storage',
        libraryExport: "default",
        umdNamedDefine: true
    }
}