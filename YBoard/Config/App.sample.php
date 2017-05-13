<?php

return (object)[
    'app' => (object)[
        'name' => 'YBoard',
        'motto' => 'On speed again',
        'url' => '//localhost:9001', // no trailing slash
        'staticUrl' => '//localhost:9001/static', // no trailing slash
        'logoUrl' => '/img/norppa_ylilauta.svg', // relative to staticUrl
    ],
    'view' => (object)[
        'maxPages' => 100,
        'maxCatalogPages' => 10,
        'previewPosts' => 3,
    ],
    'themes' => (object)[
        'default' => (object)[
            'name' => 'Ylilauta',
            'light' => '/css/ylilauta.css', // relative to staticUrl
            'dark' => '/css/ylilauta_dark.css', // relative to staticUrl
        ],
    ],
    'users' => (object)[
        'usernameMaxLength' => 30,
    ],
    'posts' => (object)[
        'subjectMaxLength' => 60,
        'messageMaxLength' => 12000,
        'replyIntervalLimit' => 5,
        'threadIntervalLimit' => 30,
    ],
    'files' => (object)[
        'url' => '//localhost:9001/static/files', // no trailing slash
        'savePath' => ROOT_PATH . '/public/static/files', // no trailing slash
        'diskMinFree' => 1073741824,
        'maxSize' => 10485760,
        'maxPixelCount' => 50000000,
        'imgMaxWidth' => 1920,
        'imgMaxHeight' => 1920,
        'thumbMaxWidth' => 240,
        'thumbMaxHeight' => 240,
        'acceptedTypes' => '.jpg,.png,.gif,.m4a,.aac,.mp3,.mp4,.webm',
    ],
    'i18n' => (object)[
        'defaultLocale' => 'fi_FI.UTF-8', // Used as a fallback if autodetect fails
    ],
    'search' => (object)[
        'enabled' => false,
        'gCsePartnerPub' => 'partner-pub-1234567890:1234567890', // Google CSE
    ],
    'reCaptcha' => (object)[
        'enabled' => false,
        'publicKey' => 'xxx',
        'privateKey' => 'xxx',
    ],
];
