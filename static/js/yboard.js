/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var YQuery = function () {
    function YQuery() {
        _classCallCheck(this, YQuery);

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
            'cache': false
        };
    }

    _createClass(YQuery, [{
        key: 'on',
        value: function on(eventName, target, fn) {
            document.addEventListener(eventName, function (event) {
                if (!target || event.target.matches(target)) {
                    fn(event);
                }
            });

            return this;
        }
    }, {
        key: 'toggle',
        value: function toggle(element) {
            if (window.getComputedStyle(element).display === 'block') {
                element.style.display = 'none';
            } else {
                element.style.display = 'block';
            }
        }

        // AJAX

    }, {
        key: 'ajaxSetup',
        value: function ajaxSetup(options) {
            this.ajaxOptions = Object.assign(this.ajaxOptions, options);
        }
    }, {
        key: 'get',
        value: function get(url) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            options = Object.assign({
                'url': url
            }, options);

            return this.ajax(options);
        }
    }, {
        key: 'post',
        value: function post(url, data) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

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
    }, {
        key: 'ajax',
        value: function ajax() {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            options = Object.assign(this.ajaxOptions, options);
            console.log(options);

            if (!options.cache) {
                options.headers = Object.assign(options.headers, {
                    'Cache-Control': 'no-cache, max-age=0'
                });
            }

            var xhr = new XMLHttpRequest();
            xhr.timeout = options.timeout;
            xhr.open(options.method, options.url);

            for (var key in options.headers) {
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
    }]);

    return YQuery;
}();

exports.default = new YQuery();

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


if (typeof NodeList.prototype.remove !== 'function') {
    Element.prototype.remove = function () {
        this.parentElement.removeChild(this);
    };
}

if (typeof NodeList.prototype.forEach !== 'function') {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

if (typeof Element.prototype.matches !== 'function') {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.webkitMatchesSelector || function matches(selector) {
        var element = this;
        var elements = (element.document || element.ownerDocument).querySelectorAll(selector);
        var index = 0;

        while (elements[index] && elements[index] !== element) {
            ++index;
        }

        return Boolean(elements[index]);
    };
}

if (typeof Element.prototype.closest !== 'function') {
    Element.prototype.closest = function closest(selector) {
        var element = this;

        while (element && element.nodeType === 1) {
            if (element.matches(selector)) {
                return element;
            }

            element = element.parentNode;
        }

        return null;
    };
}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Element.prototype.setAttributes = function (attributes) {
    for (var key in attributes) {
        if (!attributes.hasOwnProperty(key)) {
            return true;
        }

        this.setAttribute(key, attributes[key]);
    }
};

Element.prototype.appendBefore = function (elm) {
    elm.parentNode.insertBefore(this, elm);
};

Element.prototype.appendAfter = function (elm) {
    elm.parentNode.insertBefore(this, elm.nextSibling);
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _YQuery = __webpack_require__(0);

var _YQuery2 = _interopRequireDefault(_YQuery);

var _Captcha = __webpack_require__(5);

var _Captcha2 = _interopRequireDefault(_Captcha);

var _Theme = __webpack_require__(6);

var _Theme2 = _interopRequireDefault(_Theme);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var YBoard = function () {
    function YBoard() {
        _classCallCheck(this, YBoard);

        this.theme = _Theme2.default;

        if (this.isBadBrowser()) {
            this.browserWarning();
        }
    }

    _createClass(YBoard, [{
        key: 'isBadBrowser',
        value: function isBadBrowser() {
            if (typeof FormData !== 'function') {
                return true;
            }

            if ((typeof localStorage === 'undefined' ? 'undefined' : _typeof(localStorage)) !== 'object') {
                return true;
            }

            return false;
        }
    }, {
        key: 'browserWarning',
        value: function browserWarning() {
            var browserWarning = document.createElement('div');
            browserWarning.classList.add('old-browser-warning');
            browserWarning.innerHTML = '<p>' + messages.oldBrowserWarning + '</p>';

            document.body.appendChild(browserWarning);
        }
    }, {
        key: 'spinnerHtml',
        value: function spinnerHtml(classes) {
            if (typeof classes === 'undefined') {
                classes = '';
            } else {
                classes += ' ';
            }

            return '<span class="' + classes + 'loading icon-loading spin"></span>';
        }
    }, {
        key: 'submitForm',
        value: function submitForm(e) {
            e.preventDefault();

            if (!('FormData' in window)) {
                toastr.error(messages.oldBrowserWarning, messages.errorOccurred);
                return false;
            }

            var form = $(e.target);
            var fd = new FormData(e.target);

            var overlay = $('<div class="form-overlay"><div>' + this.spinnerHtml() + '</div></div>');
            form.append(overlay);

            $.ajax({
                url: form.attr('action'),
                type: "POST",
                data: fd
            }).done(function (data) {
                if (data.reload) {
                    if (data.url) {
                        window.location = data.url;
                    } else {
                        window.location.reload();
                    }
                } else {
                    overlay.remove();
                    toastr.success(data.message);
                    form.reset();
                }
            }).fail(function () {
                overlay.remove();
            });
        }
    }, {
        key: 'signup',
        value: function signup(elm, e) {
            // Signup form in sidebar
            e.preventDefault();
            elm = $(elm);

            _Captcha2.default.render('signup-captcha', {
                'size': 'invisible',
                'theme': 'dark'
            });

            var form = $('#login');
            var signupForm = $('#signup-form');

            if (typeof form.data('login') === 'undefined') {
                form.data('login', form.attr('action'));
            }

            if (!elm.data('open')) {
                form.attr('action', form.data('signup'));
                elm.html(messages.cancel);
                $('#loginbutton').val(messages.signUp);
                signupForm.slideDown();
                elm.data('open', true);
            } else {
                form.attr('action', form.data('login'));
                elm.html(messages.signUp);

                $('#loginbutton').val(messages.logIn);
                signupForm.slideUp();
                signupForm.find('input').val('');
                elm.data('open', false);
            }
        }
    }], [{
        key: 'pageReload',
        value: function pageReload() {
            window.location = window.location.href.split('#')[0];
        }
    }, {
        key: 'returnToBoard',
        value: function returnToBoard() {
            // Remove everything after the last slash and redirect
            // Should work if we are in a thread, otherwise not really
            var url = window.location.href;
            url = url.substr(0, url.lastIndexOf('/') + 1);

            window.location = url;
        }
    }]);

    return YBoard;
}();

exports.default = new YBoard();

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(1);

__webpack_require__(2);

var _YQuery = __webpack_require__(0);

var _YQuery2 = _interopRequireDefault(_YQuery);

var _YBoard = __webpack_require__(3);

var _YBoard2 = _interopRequireDefault(_YBoard);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_YQuery2.default.ajaxSetup({
    'timeout': 10000,
    'headers': {
        'X-CSRF-Token': '123'
    },
    'errorFunction': function errorFunction(xhr) {
        'use strict';

        var errorMessage = xhr.responseText;
        var errorTitle = messages.errorOccurred;
        if (xhr.responseText.length === 0 && xhr.readyState === 0 && xhr.status === 0) {
            errorMessage = messages.networkError;
        } else if (xhr.responseText === 'timeout') {
            errorMessage = messages.timeoutWarning;
        } else {
            try {
                var text = JSON.parse(xhr.responseText);
                errorMessage = text.message;
                if (typeof text.title !== 'undefined' && text.title !== null && text.title.length !== 0) {
                    errorTitle = text.title;
                }
            } catch (e) {
                errorMessage = xhr.status + ' ' + xhr.responseText;
            }
        }

        if (xhr.status === 418) {
            alert(errorMessage);
        } else {
            alert(errorMessage + ' ' + errorTitle);
        }
    },
    'timeoutFunction': function timeoutFunction(xhr) {
        'use strict';

        alert(messages.timeoutWarning);
    }
});

window.YBoard = _YBoard2.default;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
// reCAPTCHA

exports.default = {
    render: function render(elm, options) {
        options = Object.assign({ 'sitekey': config.reCaptchaPublicKey }, options);

        if (typeof grecaptcha === 'undefined' || !document.getElementById(elm)) {
            return false;
        }

        if (!!document.getElementById(elm).innerHTML) {
            return true;
        }
        grecaptcha.render(elm, options);
    },
    reset: function reset() {
        if (typeof grecaptcha === 'undefined') {
            return true;
        }

        grecaptcha.reset();
    }
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _YQuery = __webpack_require__(0);

var _YQuery2 = _interopRequireDefault(_YQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Theme = function () {
    function Theme() {
        _classCallCheck(this, Theme);
    }

    _createClass(Theme, [{
        key: 'toggleSidebar',
        value: function toggleSidebar() {
            if (document.getElementById('hide-sidebar') !== null) {
                document.getElementById('hide-sidebar').remove();
                document.getElementById('sidebar').classList.remove('visible');

                _YQuery2.default.post('/api/user/preferences/sidebar', {
                    'sidebarHidden': 'false'
                });
            } else {
                var hideSidebarCss = document.createElement('link');
                hideSidebarCss.setAttribute('rel', 'stylesheet');
                hideSidebarCss.setAttribute('id', 'hide-sidebar');
                hideSidebarCss.setAttribute('href', config.staticUrl + '/css/hide_sidebar.css');
                document.querySelector('head').appendChild(hideSidebarCss);

                _YQuery2.default.post('/api/user/preferences/set', {
                    'sidebarHidden': 'true'
                });
            }
        }
    }, {
        key: 'switchVariation',
        value: function switchVariation() {
            var css = document.querySelectorAll('head .css');
            css = css[css.length - 1];

            var current = css.getAttribute('href');
            var variation = css.dataset.alt;

            var newCss = document.createElement('link');
            newCss.setAttributes({
                'rel': 'stylesheet',
                'class': 'css',
                'href': variation,
                'data-alt': current
            });
            newCss.appendAfter(css);

            var timeout = setTimeout(function () {
                css.remove();
            }, 5000);

            _YQuery2.default.post('/api/user/preferences/set', {
                'themeVariation': 'true'
            });
        }
    }]);

    return Theme;
}();

exports.default = new Theme();

/***/ })
/******/ ]);