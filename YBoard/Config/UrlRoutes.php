<?php

// Routing rules for the router
// URL Regex => array(Controller name, Action name]
return [
    '#^/$#' => ['Index', 'index'],

    // Gold account
    '#^/gold$#' => ['GoldAccount', 'index'],

    // Info pages
    '#^/info/faq$#' => ['InfoPages', 'faq'],
    '#^/info/rules$#' => ['InfoPages', 'rules'],
    '#^/info/about$#' => ['InfoPages', 'about'],
    '#^/info/advertising$#' => ['InfoPages', 'advertising'],
    '#^/search$#' => ['Search', 'index'],

    // Preferences
    '#^/preferences$#' => ['Preferences', 'index'],

    // User account related
    '#^/profile/?(.+)?$#' => ['Profile', 'index'],

    // Custom boards
    '#^/((my|replied|followed|hidden)threads)(-([2-9]|[1-9][0-9]+))?/$#' => ['CustomBoard', 'index'],
    '#^/((my|replied|followed|hidden)threads)/catalog-?([2-9]|[1-9][0-9]+)?$#' => ['CustomBoard', 'catalog'],

    // Mod
    '#^/scripts/mod/banform$#' => ['Mod', 'banForm'],
    '#^/scripts/mod/addban$#' => ['Mod', 'addBan'],
    '#^/scripts/mod/reports/setchecked$#' => ['PostReport', 'setChecked'],
    '#^/mod/reports$#' => ['PostReport', 'uncheckedReports'],

    // Post reporting
    '#^/scripts/report/getform$#' => ['PostReport', 'getForm'],

    // API
    //-----
    '#^/api/user/create$#' => ['Api\User', 'create'],
    '#^/api/user/delete$#' => ['Api\User', 'delete'],
    '#^/api/user/changename$#' => ['Api\User', 'changeName'],
    '#^/api/user/changepassword$#' => ['Api\User', 'changePassword'],
    '#^/api/user/preferences/set$#' => ['Api\UserPreferences', 'set'],

    // Sign up, log in, log out
    '#^/api/user/session/create$#' => ['Api\UserSession', 'create'],
    '#^/api/user/session/delete$#' => ['Api\UserSession', 'delete'],

    // File scripts
    '#^/api/file/create#' => ['Api\File', 'upload'],
    '#^/api/file/delete$#' => ['Api\File', 'delete'],
    '#^/api/file/getmediaplayer$#' => ['Api\File', 'getMediaPlayer'],

    // Posts
    '#^/api/post/([0-9]+)$#' => ['Api\Post', 'redirect'],
    '#^/api/post/get$#' => ['Api\Post', 'get'],
    '#^/api/post/create$#' => ['Api\Post', 'create'],
    '#^/api/post/delete$#' => ['Api\Post', 'delete'],
    '#^/api/post/deletefile$#' => ['Api\Post', 'deleteFile'],
    '#^/api/post/report$#' => ['Api\Post', 'report'],

    // Thread scripts
    '#^/api/thread/getreplies$#' => ['Api\Thread', 'getReplies'],
    '#^/api/thread/update$#' => ['Api\Thread', 'update'],

    // Follow threads
    '#^/api/thread/follow/create$#' => ['Api\ThreadFollow', 'create'],
    '#^/api/thread/follow/delete$#' => ['Api\ThreadFollow', 'delete'],
    '#^/api/thread/follow/markallread$#' => ['Api}ThreadFollow', 'markAllRead'],

    // Notifications
    '#^/api/notification/getall$#' => ['Notification', 'getAll'],
    '#^/api/notification/markread$#' => ['Notification', 'markRead'],
    '#^/api/notification/markallread$#' => ['Notification', 'markAllRead'],

    // Boards
    //--------
    // Checked at the end so other rules override
    '#^/([a-zA-Z0-9åäö]+)(-?([2-9]|[1-9][0-9]+))?/$#' => ['Board', 'index'],
    '#^/([a-zA-Z0-9åäö]+)/catalog(-?([2-9]|[1-9][0-9]+))?$#' => ['Board', 'catalog'],
    '#^/([a-zA-Z0-9åäö]+)/([0-9]+)$#' => ['Thread', 'index'],

    // Boards without slash at end
    '#^/([a-zA-Z0-9åäö]+)(-?([2-9]|[1-9][0-9]+))?$#' => ['Board', 'redirect'],

    // Everything else should just return a 404
    '#.*#' => ['Errors', 'notFound'],
];
