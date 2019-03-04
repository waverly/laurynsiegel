const path = require("path");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.(s*)css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {
              loader: "css-loader",
              options: {
                autoprefixer: false,
                sourceMap: true,
                importLoaders: 1
              }
            },
            "postcss-loader"
          ]
        })
      }
    ]
  },
  entry: {
    index: "./src/js/index.js"
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  watch: true,
  resolve: { extensions: [".js", ".ts"] },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      inject: "head",
      template: "./src/index.html",
      chunks: ["index"],
      filename: "./index.html" //relative to root of the application
    })
  ]
};
