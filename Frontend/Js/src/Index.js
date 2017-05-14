'use strict';

import './Polyfills';
import './PrototypeExtensions';
import './Events';

import YQuery from './YQuery';
import YBoard from './YBoard';

YQuery.ajaxSetup({
    // AJAX options
    'timeout': 10000,
    'errorFunction': function(xhr) {
        let errorMessage = xhr.responseText;
        let errorTitle = messages.errorOccurred;
        if (xhr.responseText.length === 0 && xhr.readyState === 0 && xhr.status === 0) {
            errorMessage = messages.networkError;
        } else {
            if (xhr.responseText === 'timeout') {
                errorMessage = messages.timeoutWarning;
            } else {
                try {
                    let text = JSON.parse(xhr.responseText);
                    errorMessage = text.message;
                    if (typeof text.title !== 'undefined' && text.title !== null && text.title.length !== 0) {
                        errorTitle = text.title;
                    }
                } catch (e) {
                    errorMessage = xhr.responseText;
                }
            }
        }

        if (xhr.status === 418) {
            YBoard.Toast.error(errorMessage);
        } else {
            YBoard.Toast.error(errorMessage, errorTitle);
        }
    },
    'timeoutFunction': function(xhr) {
        YBoard.Toast.error(messages.timeoutWarning);
    },
}, {
    // Headers
    'X-CSRF-Token': typeof csrfToken !== 'undefined' ? csrfToken : null,
});

window.YBoard = YBoard;
window.YQuery = YQuery;

// Localize dates, numbers and currencies
document.querySelectorAll('.datetime').forEach(function(elm) {
    this.innerHTML = new Date(this.innerHTML.replace(' ', 'T') + 'Z').toLocaleString();
});
document.querySelectorAll('.number').forEach(function(elm) {
    this.innerHTML = parseFloat(this.innerHTML).toLocaleString();
});
document.querySelectorAll('.currency').forEach(function(elm) {
    this.innerHTML = parseFloat(this.innerHTML).toLocaleString('', {
        'style': 'currency',
        'currency': 'eur'
    });
});
