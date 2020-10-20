import webpack from 'webpack';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = function(env) {
  return {
    mode: 'development',
    devtool: '#source-map',
    node: {
      fs: 'empty',
      net: 'empty',
      module: 'empty'
    },
    entry: ['webpack/hot/dev-server', 'webpack-hot-middleware/client?path=//localhost:' + (env.PORT || 1111) + '/__webpack_hmr&reload=true', './src/frontend/App.js'],
    output: {
      path: path.resolve(__dirname + '/src/frontend'),
      publicPath: '/',
      filename: 'scripts/bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  localIdentName: '[name]_[local]_[hash:base64:5]'
                }
              }
            }
          ]
        },
        {
          test: /\.scss$/,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader'
            }
          ]
        },
        {
          test: /\.(png|jp(e*)g)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8000, // Convert images < 8kb to base64 strings
                name: 'frontend/img/[hash]-[name].[ext]'
              }
            }
          ]
        },
        {
          test: /\.(eot|ttf|svg|woff|woff2)$/,
          exclude: [path.resolve(__dirname, 'src/frontend/images')],
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'frontend/fonts/[path][name].[ext]'
              }
            }
          ]
        },
        {
          test: /\.svg$/,
          include: [path.resolve(__dirname, 'src/frontend/images')],
          loader: 'file-loader',
          options: {
            name: 'frontend/img/[path][name].[ext]'
          }
        }
      ]
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        template: './src/index.template.html',
        inject: 'body',
        filename: 'index.html'
      })
    ],
    resolve: {
      modules: ['node_modules'],
      alias: {
        Components: path.resolve('./src/frontend/Components'),
        Containers: path.resolve('./src/frontend/Containers'),
        css: path.resolve('./src/frontend/css'),
        Images: path.resolve('./src/frontend/images'),
        Assets: path.resolve('./src/backend/assets'),
        Routes: path.resolve('./src/backend/routes')
      },
      extensions: ['.js', '.jsx', '.json', '.css', '.scss']
    },
    target: 'web'
  };
};
