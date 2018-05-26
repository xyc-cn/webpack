'use strict'
const path = require('path')
const utils = require('./utils')
const fs = require('fs-extra');
const config = require('../config')
const vueLoaderConfig = require('./vue-loader.conf')
const VirtualModulePlugin = require('virtual-module-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const isProd = process.env.NODE_ENV === 'production';
const entry = {};

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

{{#lint}}const createLintingRule = () => ({
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [resolve('src'), resolve('test')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: !config.dev.showEslintErrorsInOverlay
  }
}){{/lint}}


/**
 * generate entry
 * @param dir
 */
const walk = (dir) => {
  dir = dir || '.';
  const directory = path.posix.join(__dirname, '../src', dir);
  fs.readdirSync(directory).forEach((file) => {
    const fullpath = path.posix.join(directory, file);
  const stat = fs.statSync(fullpath);
  const extname = path.posix.extname(fullpath);
  if (stat.isFile() && extname === '.vue' && fullpath.indexOf('v_entry') >= 0) {
    const name = path.posix.join(dir, path.posix.basename(file, extname));
    if (fullpath.indexOf('v_entry') >= 0) {
      entry[name] = './' + fullpath;
    }
  } else if (stat.isDirectory() && file !== 'build' && file !== 'include') {
    const subdir = path.posix.join(dir, file);
    walk(subdir);
  }
});
}

walk('pages');

console.log(entry)

const plugins = [];

let htmlPluginList = [],entryPluginList=[];
//处理entry
let keyList = Object.keys(entry);
keyList.forEach(function (v, i) {
  let reg = v.match(/pages\/(.*)\/(.*)\//), pageName, moduleName;
  if (reg) {
    pageName = reg[2];
    moduleName = reg[1];
  } else {
    throw new Error('entry error')
  }
  htmlPluginList.push(new HtmlWebpackPlugin({
    template: 'template/index.dev.html',
    title: '',
    // isDevServer: true,
    filename: 'pages/' + moduleName + '/' + pageName + '.html',
    chunks: [v],
    chunksSortMode: 'dependency',
    minify: isProd ? {
      removeComments: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true
    } : false,
    hash: true,
    inject: true
  }));
  entry[v] = entry[v].replace('.vue','.js');

  if(!fs.existsSync(path.join(process.cwd(),'src/' + v + '.js'))){
    //use virtual plugin
    entryPluginList.push(
      new VirtualModulePlugin({
        moduleName: entry[v],
        contents:  `/* eslint-disable */
                  import App from './v_entry.vue'
                  import Vue from 'vue'
                  App.el = '#root';
                  let app = new Vue(
                       App
                  );`,
      }),
    );
  }
});

module.exports = {
  context: path.resolve(__dirname, '../'),
  entry: entry,
  plugins: plugins.concat(htmlPluginList).concat(entryPluginList),
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      {{#if_eq build "standalone"}}
      'vue$': 'vue/dist/vue.esm.js',
      {{/if_eq}}
      '@': resolve('src'),
    }
  },
  module: {
    rules: [
      {{#lint}}
      ...(config.dev.useEslint ? [createLintingRule()] : []),
      {{/lint}}
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test'), resolve('node_modules/webpack-dev-server/client')]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
  node: {
    // prevent webpack from injecting useless setImmediate polyfill because Vue
    // source contains it (although only uses it if it's native).
    setImmediate: false,
    // prevent webpack from injecting mocks to Node native modules
    // that does not make sense for the client
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}
