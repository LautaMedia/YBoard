class YQuery {
    constructor() {
        this.ajaxOptions = {
            'method': 'GET',
            'url': '',
            'data': null,
            'timeout': 30000,
            'loadFunction': null,
            'timeoutFunction': null,
            'errorFunction': null,
            'loadendFunction': null,
            'headers': {
                'Cache-Control': 'no-cache, max-age=0'
            }
        };
    }

    ajaxSetup(options) {
        'use strict';

        this.ajaxOptions = this.extend(this.ajaxOptions, options);
    }

    on(eventName, target, fn) {
        document.addEventListener(eventName, function (event) {
            if (!target || event.target.matches(target)) {
                fn(event);
            }
        });

        return this;
    }

    extend(...args) {
        for (let i = 1; i < args.length; i++) {
            for (let key in args[i]) {
                if (!args[i].hasOwnProperty(key)) {
                    continue;
                }

                if (typeof args[i][key] === 'object') {
                    args[i][key] = this.extend(args[0][key], args[i][key]);
                }

                args[0][key] = args[i][key];
            }

        }

        return arguments[0];
    }

    get(url, options) {
        options = this.extend({
            'url': url
        }, options);

        return this.ajax(options);
    }

    post(url, data, options) {
        options = this.extend({
            'method': 'POST',
            'url': url,
            'data': data,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, options);

        return this.ajax(options);
    }

    ajax(options) {
        options = this.extend(this.ajaxOptions, options);

        let xhr = new XMLHttpRequest();
        xhr.timeout = options.timeout;
        xhr.open(options.method, options.url);

        for (let key in options.headers) {
            if (!options.headers.hasOwnProperty(key)) {
                continue;
            }

            xhr.setRequestHeader(key, options.headers[key]);
        }

        // OnLoad
        if (typeof options.loadFunction === 'function') {
            xhr.addEventListener('load', function () {
                if (xhr.status !== 200) {
                    return;
                }

                options.loadFunction(xhr);
            });
        }

        // OnTimeout
        if (typeof options.timeoutFunction === 'function') {
            xhr.addEventListener('timeout', function () {
                options.timeoutFunction(xhr);
            });
        }

        // OnError
        if (typeof options.errorFunction === 'function') {
            xhr.addEventListener('loadend', function () {
                if (xhr.status === 200 || xhr.status === 0) {
                    return;
                }
                options.errorFunction(xhr);
            });
        }

        // Run always
        if (typeof options.loadendFunction === 'function') {
            xhr.addEventListener('loadend', function () {
                options.loadendFunction(xhr);
            });
        }

        xhr.send(options.data);

        return xhr;
    }

    toggle(element) {
        if (window.getComputedStyle(element).display === 'block') {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }
}

export default new YQuery();
