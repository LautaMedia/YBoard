import './Polyfills';

import YQuery from './YQuery';
import YBoard from './YBoard';

YQuery.ajaxSetup({
    'timeout': 10000,
    'headers': {
        'X-AAA': '123'
    },
    'errorFunction': function(xhr) {
        'use strict';
        let errorMessage = xhr.responseText;
        let errorTitle = messages.errorOccurred;
        if (xhr.responseText.length === 0 && xhr.readyState === 0 && xhr.status === 0) {
            errorMessage = messages.networkError;
        } else if (xhr.responseText === 'timeout') {
            errorMessage = messages.timeoutWarning;
        } else {
            try {
                let text = JSON.parse(xhr.responseText);
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
    'timeoutFunction': function(xhr) {
        'use strict';
        alert(messages.timeoutWarning);
    }
});
