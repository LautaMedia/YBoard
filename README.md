# YBoard
The once to be board software for Ylilauta. Might not always be open source.

PHP code style is PSR-1/PSR-2.  
JavaScript code style is also mimicked from PSR.

Sorry about the code completely lacking in comments.

## Automatic dev environment
Requirements:
* VirtualBox
* Vagrant

### Howto
1. Clone the repository
   * PhpStorm can create a project automatically with VCS -> Checkout from Version Control
2. Copy YBoard/Config/Database.sample.php to YBoard/Config/Database.php and edit if needed
3. Copy YBoard/Config/App.sample.php to YBoard/Config/App.php and edit if needed
4. Open a command prompt in the project root folder and run `vagrant up`
5. After the (maybe lengthy) vagrant initialization, you can now open http://localhost:9001/ in your browser

To access the shell of the virtual machine (eg. for error logs), use `vagrant ssh` in the project folder.

### Usernames, passwords, paths, urls, etc.
* Server username: root
* Server password: vagrant
* MySQL username: root
* MySQL password: vagrant
* Project public URL: http://localhost:9001/
* PHPMyAdmin: http://localhost:9001/phpmyadmin/
* Project path on the server: /vagrant/

As the development environment is local and it can only be accessed from your computer,
there's no need to change the usernames or passwords. But you may if you wish.

### Performance profiling
To profile the code, Xdebug is enabled by default by the Vagrantfile.  
Do not use Xdebug in production, it's a DoS risk.
To get a profile of the code, append XDEBUG_PROFILE to any GET or POST.  
For example http://localhost:9001/?XDEBUG_PROFILE

Profiler output files (cachegrind.out.xxx) are stored in Logs/.  
They can be opened for example with PhpStorm (Tools -> Analyze Xdebug Profiler Snapshot...).

### Set up development tools
1. Install Node.js
2. `cd YBoard/Frontend/Js`
3. `npm install`
4. (If using PhpStorm) Set up project config in PhpStorm
    * Open PhpStorm Settings (File -> Settings)
    1. Editor -> Code Style
        1. PHP -> Set from... -> Predefined Style -> PSR1/PSR2
        2. JavaScript -> Set from... -> Language -> PHP
    2. Languages & Frameworks
        1. JavaScript -> JavaScript language version: ECMAScript 6
        2. PHP -> PHP language level: 7
    3. Tools -> File Watchers
        1. Add new: SCSS
            * Name: SCSS
            * File type: SCSS
            * Scope: Project Files
            * Program: /path/to/project/Frontend/Js/node_modules/.bin/node-sass(.cmd if windows)
            * Arguments: --output-style compressed $FileDirRelativeToProjectRoot$/$FileName$ static/css/$FileNameWithoutExtension$.css
            * Output paths to refresh: $ProjectFileDir$/static/css/$FileNameWithoutExtension.css
            * Working directory: $ProjectFileDir$
        2. Add new: Custom
            * Name: Webpack
            * File Type: JavaScript
            * Scope: Create custom (three dots) and Include Recursively YBoard/Frontend/Js
            * Program: /path/to/project/Frontend/Js/node_modules/.bin/webpack(.cmd if windows)
            * Arguments: -p
            * Output paths to refresh: $ProjectFileDir$/static/js/yboard.js
            * Working directory: $ProjectFileDir$/Frontend/Js

If you are not using PhpStorm, set up file watchers manually.  
You should be able to use `webpack --watch` and some similar command for node-sass.


## Manual/production setup
### Requirements
* **Linux/Unix server**
* Nginx
* PHP 7+
* MySQL 5.6+ / MariaDB
* ImageMagick
* FFmpeg 3+
* PNGCrush
* Jpegoptim
* Jpegtran (for exif rotation, might be redundant)

Why not Windows? PHP message queue only works on *NIX. That's why.
Replace the whole message queue with your own stuff if you want it to run on Windows.
Some path are also hardcoded and may not work with Windows, like "nice", "convert" and "ffmpeg" (maybe a future improvement?).

For Nginx you should just forward all requests (or just for files that do not exist) to public/index.php  
like so: `try_files $uri /index.php$args`

You also need to setup a different domain or an alias for static content.  
Do not pass any requests under the static root to PHP!  
Static root is static/.

Should work with Apache, but it's not supported as we do not use that.

### Cronjobs
To avoid unnecessary load while opening pages, all not-so-important things are run on background with cron.  
You should add the following lines to crontab. Change times to fit your needs.

```
13 * * * * php <ROOT_PATH>/RunCommand.php Cron hourly
28 1 * * * php <ROOT_PATH>/RunCommand.php Cron daily
* * * * * sh <ROOT_PATH>/rundaemon.sh
```

### Other
You need to generate locales to the server in order for i18n translations to work.
They use native gettext for maximum performance.
1. Uncomment the required ones in /etc/locale.gen
2. Run `locale-gen`
3. Restart PHP `service php7.0-fpm restart`

If you edit the config or locales, please regenerate the javascripts with `php RunCommand.php GenerateFiles allJs`.


## Discussion
For discussions in finnish, please see http://ylilauta.org/ohjelmistot/
