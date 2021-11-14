var gulp = require("gulp"), // Подключаем Gulp
  sass = require("gulp-sass"), //Подключаем Sass пакет,
  browserSync = require("browser-sync"), // Подключаем Browser Sync
  concat = require("gulp-concat"), // Подключаем gulp-concat (для конкатенации файлов)
  uglify = require("gulp-uglifyjs"), // Подключаем gulp-uglifyjs (для сжатия JS)
  cssnano = require("gulp-cssnano"), // Подключаем пакет для минификации CSS
  rename = require("gulp-rename"), // Подключаем библиотеку для переименования файлов
  del = require("del"), // Подключаем библиотеку для удаления файлов и папок
  imagemin = require("gulp-imagemin"), // Подключаем библиотеку для работы с изображениями
  pngquant = require("imagemin-pngquant"), // Подключаем библиотеку для работы с png
  cache = require("gulp-cache"), // Подключаем библиотеку кеширования
  autoprefixer = require("gulp-autoprefixer"); // Подключаем библиотеку для автоматического добавления префиксов

gulp.task("sass", function () {
  // Создаем таск Sass
  return gulp
    .src("src/css/**/*.scss") // Берем источник
    .pipe(sass()) // Преобразуем Sass в CSS посредством gulp-sass
    .pipe(rename({ suffix: ".min" })) // Добавляем суффикс .min
    .pipe(gulp.dest("src/css")) // Выгружаем результата в папку app/css
    .pipe(browserSync.reload({ stream: true })); // Обновляем CSS на странице при изменении
});

gulp.task("browser-sync", function () {
  // Создаем таск browser-sync
  browserSync({
    server: {
      // Определяем параметры сервера
      baseDir: "src",
    },
    notify: false,
  });
});

gulp.task("php", function () {
  return gulp.src("src/**/*.php").pipe(browserSync.reload({ stream: true }));
});

gulp.task("html", function () {
  return gulp.src("src/**/*.html").pipe(browserSync.reload({ stream: true }));
});

gulp.task("clean", async function () {
  return del.sync("dist"); // Удаляем папку dist перед сборкой
});

gulp.task("img", function () {
  return gulp
    .src("src/img/**/*") // Берем все изображения из app
    .pipe(
      cache(
        imagemin({
          // С кешированием
          // .pipe(imagemin({ // Сжимаем изображения без кеширования
          interlaced: true,
          progressive: true,
          svgoPlugins: [{ removeViewBox: false }],
          use: [pngquant()],
        })
      ) /**/
    )
    .pipe(gulp.dest("dist/css/images")); // Выгружаем на продакшен
});

gulp.task("prebuild", async function () {
  var build = gulp
    .src("src/**/*") // Переносим шрифты в продакшен
    .pipe(gulp.dest("dist"));
});

gulp.task("clear", function (callback) {
  return cache.clearAll();
});

gulp.task("watch", function () {
  gulp.watch("src/css/**/*.scss", gulp.parallel("sass")); // Наблюдение за sass файлами
  gulp.watch("src/**/*.php", gulp.parallel("php")); // Наблюдение за PHP файлами в корне проекта
  gulp.watch("src/**/*.html", gulp.parallel("html")); // Наблюдение за HTML файлами в корне проекта
});

gulp.task("default", gulp.parallel("sass", "browser-sync", "watch"));
gulp.task("build", gulp.parallel("prebuild", "clean", "img", "sass"));
