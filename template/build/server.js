const devConfigPromise = require('./webpack.dev.conf.js');
const config = require('../config')
const webpack = require('webpack');
const pathTo = require('path');
const fs = require('fs');
const webpackDevMiddleware = require("webpack-dev-middleware")
const hotMiddleware = require('webpack-hot-middleware');
const MultiEntryPlugin = require("webpack/lib/MultiEntryPlugin");
const express = require('express');

devConfigPromise.then(devConfig => {
  //first run only build one entry js buddle
  let keyList = Object.keys(devConfig.entry), newEntry = {}
  keyList.forEach(function (v, i) {
    if (i === 0) {
      newEntry[v] = [devConfig.entry[v], 'webpack-hot-middleware/client']
    }
  });
  devConfig.entry = newEntry;

  const app = express(), complier = webpack(devConfig);

  const webpackDevMiddlewareInstance = webpackDevMiddleware(complier, {
    publicPath: devConfig.output.publicPath
  })

  app.use(function (req, res, next) {
    let reg = req.url.match(/pages\/(\w+)\/(\w+)\.html/);
    if (reg) {
      if (fs.existsSync(pathTo.join(process.cwd(), `./src/pages/${reg[1]}/${reg[2]}/v_entry.vue`))) {
        if (!devConfig.entry[`pages/${reg[1]}/${reg[2]}/v_entry`]) {
          devConfig.entry[`pages/${reg[1]}/${reg[2]}/v_entry`] = true;
          //add new entry
          complier.apply(new MultiEntryPlugin(process.cwd(), [`./src/pages/${reg[1]}/${reg[2]}/v_entry`, 'webpack-hot-middleware/client'], `pages/${reg[1]}/${reg[2]}/v_entry`));
          //force build
          webpackDevMiddlewareInstance.invalidate()
        }
      } else {
        res.end('pages not found');
        return;
      }
    }
    next();
  });

//use hot reload middleware
  app.use(webpackDevMiddlewareInstance);
  app.use(hotMiddleware(complier));

// set static file
  app.use(express.static(pathTo.join(__dirname, "dist")))

  app.listen(config.dev.port, function () {
    console.log("start success ：localhost:" + config.dev.port)
  });
})
