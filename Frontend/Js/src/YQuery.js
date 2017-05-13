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
                'X-Requested-With': 'XMLHttpRequest'
            },
            'cache': false,
        };
    }

    on(eventName, target, fn) {
        document.addEventListener(eventName, function (event) {
            if (!target || event.target.matches(target)) {
                fn(event);
            }
        });

        return this;
    }

    toggle(element) {
        if (window.getComputedStyle(element).display === 'block') {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }

    // AJAX

    ajaxSetup(options) {
        this.ajaxOptions = Object.assign(this.ajaxOptions, options);
    }

    get(url, options = {}) {
        options = Object.assign({
            'url': url
        }, options);

        return this.ajax(options);
    }

    post(url, data, options = {}) {
        options = Object.assign({
            'method': 'POST',
            'url': url,
            'data': data,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, options);

        return this.ajax(options);
    }

    ajax(options = {}) {
        options = Object.assign(this.ajaxOptions, options);
        console.log(options);

        if (!options.cache) {
            options.headers = Object.assign(options.headers, {
                'Cache-Control': 'no-cache, max-age=0'
            });
        }

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
}

export default new YQuery();
