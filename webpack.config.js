const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/index.js",
    //SIRVE PARA PRODUCCION!
    // output: {
    //   path: path.resolve(__dirname, "dist"),
    //   filename: "bundle.js",
    //   publicPath: "./", // Rutas relativas en producción
    // },

    //SIRVE PARA DESARROLLO
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
      publicPath: isProduction ? "./" : "/", // Correctamente resuelve las rutas en producción
    },

    mode: isProduction ? "production" : "development",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|gif|svg)$/i,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[path][name].[ext]",
                outputPath: "assets/",
                publicPath: "assets/",
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html", // Asegúrate de que la plantilla HTML está correctamente señalada
        filename: "index.html", // Asegúrate de que el archivo generado esté en dist/
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "public"),
      },
      compress: true,
      port: 9000,
      hot: true,
    },
  };
};
