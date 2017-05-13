class YQuery
{
    constructor()
    {
        this.ajaxOptions = {
            'method': 'GET',
            'url': '',
            'data': null,
            'timeout': 30000,
            'loadFunction': null,
            'timeoutFunction': null,
            'errorFunction': null,
            'loadendFunction': null,
            'cache': false,
            'contentType': null,
            'xhr': null,
        };
        this.ajaxHeaders = {
            'X-Requested-With': 'XMLHttpRequest',
        };
    }

    on(eventName, target, fn)
    {
        document.addEventListener(eventName, function(event)
        {
            if (!target || event.target.matches(target)) {
                fn(event);
            }
        });

        return this;
    }

    toggle(element)
    {
        if (window.getComputedStyle(element).display === 'block') {
            element.style.display = 'none';
        } else {
            element.style.display = 'block';
        }
    }

    // AJAX

    ajaxSetup(options, headers = {})
    {
        this.ajaxOptions = Object.assign(this.ajaxOptions, options);
        this.ajaxHeaders = Object.assign(this.ajaxHeaders, headers);
    }

    get(url, options = {}, headers = {})
    {
        options = Object.assign({
            'url': url,
        }, options);

        headers = Object.assign(this.ajaxHeaders, headers);

        return this.ajax(options, headers);
    }

    post(url, data, options = {}, headers = {})
    {
        options = Object.assign({
            'method': 'POST',
            'url': url,
            'data': data,
            'contentType': 'application/x-www-form-urlencoded; charset=UTF-8',
        }, options);

        if (options.contentType !== null) {
            headers = Object.assign(headers, {
                'Content-Type': options.contentType
            });
        }

        headers = Object.assign(this.ajaxHeaders, headers);

        return this.ajax(options, headers);
    }

    ajax(options = {}, headers = {})
    {
        options = Object.assign(this.ajaxOptions, options);

        if (!options.cache) {
            headers = Object.assign(headers, {
                'Cache-Control': 'no-cache, max-age=0',
            });
        }

        let xhr = new XMLHttpRequest();
        xhr.timeout = options.timeout;
        xhr.open(options.method, options.url);

        for (let key in headers) {
            if (!headers.hasOwnProperty(key)) {
                continue;
            }

            xhr.setRequestHeader(key, headers[key]);
        }

        // OnLoad
        this.onLoad = function(fn)
        {
            xhr.addEventListener('load', function()
            {
                if (xhr.status !== 200) {
                    return;
                }

                fn(xhr);
            });

            return this;
        };
        if (typeof options.loadFunction === 'function') {
            this.onLoad(options.loadFunction);
        }

        // OnTimeout
        this.onTimeout = function(fn)
        {
            xhr.addEventListener('timeout', function()
            {
                fn(xhr);
            });

            return this;
        };
        if (typeof options.timeoutFunction === 'function') {
            this.onTimeout(options.timeoutFunction);
        }

        // OnError
        this.onError = function(fn)
        {
            xhr.addEventListener('loadend', function()
            {
                if (xhr.status === 200 || xhr.status === 0) {
                    return;
                }
                fn(xhr);
            });

            return this;
        };
        if (typeof options.errorFunction === 'function') {
            this.onError(options.errorFunction);
        }

        // Run always
        this.onEnd = function(fn)
        {
            xhr.addEventListener('loadend', function()
            {
                fn(xhr);
            });

            return this;
        };
        if (typeof options.loadendFunction === 'function') {
            this.onEnd(options.loadendFunction);
        }

        this.getXhrObject = function()
        {
            return xhr;
        };

        // Customizable XHR-object
        if (typeof options.xhr === 'function') {
            xhr = options.xhr(xhr);
        }

        window.fd = options.data;
        xhr.send(options.data);

        return this;
    }
}

export default new YQuery();
