var webpack = require('webpack');
var path = require('path');

module.exports = {
    mode: "production",
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    },
	entry: [
		path.join(__dirname, '../src/index.js')
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
				exclude: [/node_modules/, /old/],
				loader: 'babel-loader'
            },
            {
				test: /\.less$/, 
				loaders: ["style-loader", "css-loader", "sass-loader"]
			}
        ]
    },
    output: {
        path: __dirname + '/extension',
        filename: 'bundle.js'
    }
}