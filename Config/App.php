<?php

return [
    'view' => [
        'siteName' => 'Ylilauta',
        'siteMotto' => 'Suomalaisen internetkulttuurin sanansaattaja',
        'baseUrl' => '//localhost:9001',
        'staticUrl' => '//localhost:9001/static',
        'uploadMaxSize' => 104857600,
        'maxPages' => 100,
        'maxCatalogPages' => 10,
        'previewPosts' => 3,
        'subjectMaxLength' => 60,
        'messageMaxLength' => 12000,
        'acceptedFileTypes' => '.jpg,.png,.gif,.m4a,.aac,.mp3,.mp4,.webm',
        'gCsePartnerPub' => 'partner-pub-8488309688101323:6580750696', // Google CSE
        'usernameMaxLength' => 30,
        'themes' => [
            'default' => [
                'name' => 'Ylilauta',
                'css' => 'ylilauta',
                'altCss' => 'ylilauta_dark',
            ],
            'ylilauta_2014' => [
                'name' => 'Ylilauta 2014',
                'css' => 'ylilauta_2014',
                'altCss' => 'northboard',
            ],
            /*
            'ylilauta_2011' => [
                'name' => 'Ylilauta 2011',
                'css' => ['ylilauta_2011'],
            ],
            */
        ],
    ],
    'posts' => [
        'replyIntervalLimit' => 5,
        'threadIntervalLimit' => 30,
    ],
    'files' => [
        'savePath' => ROOT_PATH . '/public/static/files',
        'diskMinFree' => 1073741824,
        'maxSize' => 104857600,
        'maxPixelCount' => 50000000,
        'imgMaxWidth' => 1920,
        'imgMaxHeight' => 1920,
        'thumbMaxWidth' => 240,
        'thumbMaxHeight' => 240,
    ],
    'i18n' => [
        'defaultLocale' => 'fi_FI.UTF-8', // Used as a fallback if autodetect fails
        'defaultTimezone' => 'Europe/Helsinki',
    ],
    'reCaptcha' => [
        'publicKey' => '6LeOsCMTAAAAAFCDJn4kUoT07EMOecsiZ1pg1eFy',
        'privateKey' => '6LeOsCMTAAAAAI1WVx2bUSf7orSfS1ROsK13V6va',
    ],
];
