#!/usr/bin/env bash
DBNAME=yboard
DBPASSWD=vagrant

# Change apt server and update
#sed -i -e 's=//us.archive.ubuntu=//archive.ubuntu=g' /etc/apt/sources.list
add-apt-repository ppa:ondrej/php -y
apt update

# Install PHP7, Nginx, MySQL, PNGCrush, JpegOptim, ImageMagick
debconf-set-selections <<< "mysql-server mysql-server/root_password password ${DBPASSWD}"
debconf-set-selections <<< "mysql-server mysql-server/root_password_again password ${DBPASSWD}"

apt install -y jpegoptim libjpeg-turbo-progs pngcrush imagemagick nginx mysql-server-5.7 php7.1-fpm php7.1-mysql php7.1-mbstring php7.1-gd php-apcu php-xdebug php-imagick ffmpeg

# Nginx config
sed -i -e 's/^user .*;/user ubuntu;/g' /etc/nginx/nginx.conf
sed -i -e 's/#\? \?use .*;//g' /etc/nginx/nginx.conf
sed -i -e 's/#\? \?multi_accept .*;/multi_accept on; use epoll;/g' /etc/nginx/nginx.conf

# SSL is not enabled, but this is how you should do it.
# See also the commented-out ssl directives in nginx-config.
#openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

cat > /etc/nginx/conf.d/zz-setit.conf << EOM
# Basic
server_tokens off;

fastcgi_buffers 16 16k;
fastcgi_buffer_size 32k;

client_max_body_size 200M;

# SSL
#ssl_ciphers 'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS';
#ssl_dhparam /etc/ssl/certs/dhparam.pem;
#ssl_session_cache shared:SSL:50m;
#ssl_session_timeout 1d;
#resolver 8.8.8.8 8.8.4.4

# Gzip
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types image/svg+xml text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_min_length 1024;

# Limit req
limit_req_zone \$binary_remote_addr zone=reqs:10m rate=10r/s;
EOM

cat > /etc/nginx/snippets/security.conf << EOM
# Security
location ~ /\.ht { return 404; }
EOM
cat > /etc/nginx/snippets/php-upstream.conf << EOM
location ~ \.php\$ {
    limit_req zone=reqs burst=10 nodelay;

    include snippets/fastcgi-php.conf;

    # This is how YBoard knows it's being developed
    fastcgi_param APPLICATION_ENVIRONMENT development;

    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
}
EOM

# Nginx vhosts
rm /etc/nginx/sites-available/*
rm /etc/nginx/sites-enabled/*
cat > /etc/nginx/sites-available/default << EOM
server {
    server_name _;
    listen 80 default_server;
    listen [::]:80 default_server;

    # SSL example
    #listen 443 ssl http2 default_server;
    #listen [::]:443 ssl http2 default_server;
    #ssl_trusted_certificate /path/to/chain.pem
    #ssl_certificate_key /path/to/key.pem
    #ssl_certificate /path/to/fullchain.pem
    #add_header Strict-Transport-Security max-age=31536000;
    #ssl_stapling on;
    #ssl_stapling_verify on;

    root /vagrant/public;

    location /static/ {
        root /vagrant;

        location ~ ^/static/files/([a-z0-9]+)/o/([a-z0-9]+)(\.\w+)\$ { return 404; }
        location ~ \.php\$ { return 404; }

        location /static/files/ {
            # Files do not use query strings.
            if (\$query_string != '') { return 404; }

            # Fake filenames for browsers
            rewrite ^/static/files/([a-z0-9]+)/o/([a-z0-9]+)/(.+)(\.\w+)\$ /static/files/\$1/o/\$2\$4 break;
        }

    }

    index index.php;
    try_files \$uri /index.php?\$args;

    include snippets/security.conf;
    include snippets/php-upstream.conf;

    location /phpmyadmin/ {
        root /usr/share;
        include snippets/php-upstream.conf;
    }
}
EOM
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# PHP config
sed -i -e 's/;\?opcache.enable=.*/opcache.enable=1/g' /etc/php/7.1/fpm/php.ini
sed -i -e 's/upload_max_filesize \?= \?.*/upload_max_filesize = 200M/g' /etc/php/7.1/fpm/php.ini
sed -i -e 's/post_max_size \?= \?.*/post_max_size = 200M/g' /etc/php/7.1/fpm/php.ini
sed -i -e 's/error_reporting \?= \?.*/error_reporting = E_ALL/g' /etc/php/7.1/fpm/php.ini
sed -i -e 's/^user \?= \?.*/user = ubuntu/g' /etc/php/7.1/fpm/pool.d/www.conf
sed -i -e 's/^group \?= \?.*/group = ubuntu/g' /etc/php/7.1/fpm/pool.d/www.conf
sed -i -e 's/^listen.owner \?= \?.*/listen.owner = ubuntu/g' /etc/php/7.1/fpm/pool.d/www.conf
sed -i -e 's/^listen.group \?= \?.*/listen.group = ubuntu/g' /etc/php/7.1/fpm/pool.d/www.conf
echo 'xdebug.profiler_enable_trigger=1' >> /etc/php/7.1/fpm/conf.d/20-xdebug.ini
echo 'xdebug.profiler_output_dir=/vagrant/profiler' >> /etc/php/7.1/fpm/conf.d/20-xdebug.ini

# MySQL config
cat > /etc/mysql/mysql.conf.d/zz-setit.cnf << EOM
[mysqld]
skip-name-resolve

# Basics
group_concat_max_len = 65536
innodb_file_per_table = 1
innodb_log_file_size = 128M

# Buffer pool should be larger than total data in databases for optimum
# performance. Total size is size * instances.
# Remember, the buffer pools are stored in RAM, do not oversize!
innodb_buffer_pool_size = 256M
innodb_buffer_pool_instances = 1

# Flushing writes only once per 2 secs increases write performance quite a bit.
# only downside is the possible loss of 2 seconds worth of data in case of a crash.
innodb_flush_neighbors = 0
innodb_flush_log_at_trx_commit = 0
innodb_flush_log_at_timeout = 2
innodb_flush_method = O_DIRECT

# Other InnoDB related
#innodb_log_file_size = 256M
innodb_open_files = 500
#innodb_read_io_threads = 64
#innodb_write_io_threads = 64

# Slowlog
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 0.03 # Yup. 0.03 seconds is slow for a query.
log_queries_not_using_indexes = 1
EOM

# Install PHPMyAdmin
debconf-set-selections <<< "phpmyadmin phpmyadmin/dbconfig-install boolean true"
debconf-set-selections <<< "phpmyadmin phpmyadmin/mysql/app-pass string password"
debconf-set-selections <<< "phpmyadmin phpmyadmin/mysql/admin-pass password ${DBPASSWD}"
debconf-set-selections <<< "phpmyadmin phpmyadmin/reconfigure-webserver multiselect"
apt install phpmyadmin -y

mysql -uroot -p${DBPASSWD} -e "CREATE DATABASE IF NOT EXISTS ${DBNAME};"
mysql -uroot -p${DBPASSWD} ${DBNAME} < /vagrant/schema.sql

# Set locales
update-locale LANG=en_US.UTF-8 LANGUAGE=en_US.UTF-8 LC_ALL=en_US.UTF-8
sed -i -e 's/# fi_FI.UTF-8 UTF-8/fi_FI.UTF-8 UTF-8/g' /etc/locale.gen
locale-gen

# Restart configured services
service nginx restart
service php7.1-fpm restart
service mysql restart
