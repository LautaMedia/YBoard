<?php

// Routing rules for the router
// URL Regex => array(Controller name, Action name]
return [
    '#^/$#' => ['Index', 'index'],

    // Gold account
    '#^/gold$#' => ['GoldAccount', 'index'],

    // Info pages
    '#^/faq$#' => ['InfoPages', 'faq'],
    '#^/rules$#' => ['InfoPages', 'rules'],
    '#^/about$#' => ['InfoPages', 'about'],
    '#^/advertising$#' => ['InfoPages', 'advertising'],
    '#^/search$#' => ['Search', 'index'],

    // Preferences
    '#^/preferences$#' => ['Preferences', 'index'],

    // User account related
    '#^/profile/(.+)?$#' => ['User', 'profile'],

    // Custom boards
    '#^/mythreads-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'myThreads'],
    '#^/mythreads/catalog-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'myThreadsCatalog'],
    '#^/repliedthreads-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'repliedThreads'],
    '#^/repliedthreads/catalog-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'repliedThreadsCatalog'],
    '#^/followedthreads-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'followedThreads'],
    '#^/followedthreads/catalog-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'followedThreadsCatalog'],
    '#^/hiddenthreads-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'hiddenThreads'],
    '#^/hiddenthreads/catalog-?([2-9]|[1-9][0-9]+)?/$#' => ['CustomBoard', 'hiddenThreadsCatalog'],

    // Post scripts
    '#^/scripts/posts/redirect/([0-9]+)$#' => ['Post', 'redirect'],

    // Mod
    '#^/scripts/mod/banform$#' => ['Mod', 'banForm'],
    '#^/scripts/mod/addban$#' => ['Mod', 'addBan'],
    '#^/scripts/mod/reports/setchecked$#' => ['PostReport', 'setChecked'],
    '#^/mod/reports$#' => ['PostReport', 'uncheckedReports'],

    // Post reporting
    '#^/scripts/report/getform$#' => ['PostReport', 'getForm'],

    // Boards
    // Checked at the end so other rules override
    '#^/([a-zA-Z0-9åäö]+)-?([2-9]|[1-9][0-9]+)?/$#' => ['Board', 'index'],
    '#^/([a-zA-Z0-9åäö]+)/catalog-?([2-9]|[1-9][0-9]+)?/$#' => ['Board', 'catalog'],
    '#^/([a-zA-Z0-9åäö]+)/([0-9]+)$#' => ['Thread', 'index'],

    // Boards without slash at end
    '#^/([a-zA-Z0-9åäö]+)-?([2-9]|[1-9][0-9]+)?/?(catalog)?-?([2-9]|[1-9][0-9]+)?$#' => ['Board', 'redirect'],

    // API
    // ---
    '#^/api/user/preferences/save$#' => ['Preferences', 'save'],
    '#^/api/user/session/destroy$#' => ['User', 'destroySession'],
    '#^/api/user/changename$#' => ['User', 'changeName'],
    '#^/api/user/changepassword$#' => ['User', 'changePassword'],
    '#^/api/user/delete$#' => ['User', 'delete'],

    // Sign up, log in, log out
    '#^/api/user/session/signup$#' => ['Session', 'signUp'],
    '#^/api/user/session/login$#' => ['Session', 'logIn'],
    '#^/api/user/session/logout$#' => ['Session', 'logOut'],

    // Thread scripts
    '#^/api/thread/getreplies$#' => ['Thread', 'getReplies'],
    '#^/api/thread/update$#' => ['Thread', 'update'],

    // Follow threads
    '#^/api/follow/add$#' => ['ThreadFollow', 'add'],
    '#^/api/follow/remove$#' => ['ThreadFollow', 'remove'],
    '#^/api/follow/markallread$#' => ['ThreadFollow', 'markAllRead'],

    // File scripts
    '#^/api/file/upload$#' => ['File', 'upload'],
    '#^/api/file/getmediaplayer$#' => ['File', 'getMediaPlayer'],

    // Posts
    '#^/api/post/get$#' => ['Post', 'get'],
    '#^/api/post/submit$#' => ['Post', 'submit'],
    '#^/api/post/delete$#' => ['Post', 'delete'],
    '#^/api/post/deletefile$#' => ['Post', 'deleteFile'],
    '#^/api/post/report$#' => ['PostReport', 'submit'],

    // Notifications
    '#^/api/notification/getall$#' => ['Notification', 'getAll'],
    '#^/api/notification/markread$#' => ['Notification', 'markRead'],
    '#^/api/notification/markallread$#' => ['Notification', 'markAllRead'],

    // Everything else should just return a 404
    '#.*#' => ['Errors', 'notFound'],
];
