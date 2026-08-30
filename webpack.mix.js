const mix = require('laravel-mix');
require('dotenv').config();

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | 新版视图由 Vite 构建（npm run modern:build）。这里只保留仍随包发布、
 | 且不依赖已退场 CSS 框架的静态资源复制与 extra 资源编译。
 |
 */
const glob = require('glob')

let distPath = mix.inProduction() ? 'resources/dist' : 'resources/pre-dist';

function mixAssetsDir(query, cb) {
  (glob.sync('resources/assets/' + query) || []).forEach(f => {
    f = f.replace(/[\\\/]+/g, '/');
    cb(f, f.replace('resources/assets', distPath));
  });
}

function dcatPath(path) {
  return 'resources/assets/dcat/' + path;
}

function dcatDistPath(path) {
  return distPath + '/dcat/' + path;
}

mix.copyDirectory('resources/assets/images', distPath + '/images');
mix.copyDirectory('resources/assets/fonts', distPath + '/fonts');

// 复制第三方插件文件夹
mix.copyDirectory(dcatPath('plugins'), dcatDistPath('plugins'));
mix.copy(dcatPath('sass/nunito.css'), `${distPath}/dcat/css/nunito.css`);
mix.copy(dcatPath('sass/bootstrap-icons.css'), `${distPath}/dcat/css/bootstrap-icons.css`);
// 打包所有 extra 里面的所有js和css
mixAssetsDir('dcat/extra/*.js', (src, dest) => mix.js(src, dest));
mixAssetsDir('dcat/extra/*.scss', (src, dest) => mix.sass(src, dest.replace('scss', 'css')));
