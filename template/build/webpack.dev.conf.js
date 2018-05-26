'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')

const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,
})

devWebpackConfig.plugins = devWebpackConfig.plugins.concat([
  new webpack.DefinePlugin({
    'process.env': require('../config/dev.env')
  }),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin(),
  // copy custom static assets
  new CopyWebpackPlugin([
    {
      from: path.resolve(__dirname, '../static'),
      to: config.dev.assetsSubDirectory,
      ignore: ['.*']
    }
  ])
])
// module.exports = devWebpackConfig

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
portfinder.getPort((err, port) => {
  if (err) {
    reject(err)
  } else {
    // publish the new Port, necessary for e2e tests
    process.env.PORT = port
  // add port to devServer config
  config.dev.port = port
devWebpackConfig.devServer = {};
devWebpackConfig.devServer.port = port;
devWebpackConfig.devServer.host = '127.0.0.1';

// Add FriendlyErrorsPlugin
devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
  compilationSuccessInfo: {
    messages: [`Your application is running here: http://${config.dev.host}:${config.dev.port}`],
  },
  onErrors: config.dev.notifyOnErrors
    ? utils.createNotifierCallback()
    : undefined
}))

resolve(devWebpackConfig)
}
})
})
