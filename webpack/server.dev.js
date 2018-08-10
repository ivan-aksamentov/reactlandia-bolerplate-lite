const path = require('path')
const webpack = require('webpack')
const WriteFilePlugin = require('write-file-webpack-plugin')

const { IS_DEVELOPMENT, IS_PRODUCTION, IS_TESTING, MODE } = require('../lib/mode')

module.exports = {
  name: 'server',
  target: 'node',
  mode: MODE,
  devtool: 'source-map',
  entry: [
    path.resolve(__dirname, '../server/render.js'),
  ],
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, '../.dev/server'),
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: false,
            plugins: [
              'react-hot-loader/babel',
            ],
          },
        },
      },
      {
        loader: 'eslint-loader', options: {
          configFile: path.resolve(__dirname, '..', '.eslintrc'),
          quiet: true,
        },
      },
    ],
  },
  resolve: { extensions: ['.js'] },
  plugins: [
    new webpack.EnvironmentPlugin({
      BABEL_ENV: process.env.BABEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      IS_SERVER: true,
      DEBUG: IS_DEVELOPMENT,
      IS_DEVELOPMENT,
      IS_PRODUCTION,
      IS_TESTING,
      MODE,
    }),
    new WriteFilePlugin(),
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
}
