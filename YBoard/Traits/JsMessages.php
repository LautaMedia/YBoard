<?php
namespace YBoard\Traits;

trait JsMessages
{
    protected function getJsMessages()
    {
        $messages = [
            'loading' => _('Loading...'),
            'undo' => _('Undo'),
            'errorOccurred' => _('An error occurred'),
            'timeoutWarning' => _('Loading timed out – please check your internet connection'),
            'networkError' => _('Network error – please check that you are connected to the internet'),
            'logOutConfirm' => _('Log out?'),
            'signUp' => _('Sign up'),
            'cancel' => _('Cancel'),
            'logIn' => _('Log_in'),
            'maxSizeExceeded' => _('Your files exceed the maximum upload size.'),
            'confirmDeletePost' => _('Delete post?'),
            'confirmDeleteFile' => _('Delete file?'),
            'postSent' => _('Post sent'),
            'postDeleted' => _('Post deleted'),
            'fileDeleted' => _('File deleted'),
            'postReported' => _('Post reported'),
            'threadHidden' => _('Thread hidden'),
            'threadRestored' => _('Thread restored'),
            'threadLocked' => _('Thread locked'),
            'threadUnlocked' => _('Thread unlocked'),
            'threadStickied' => _('Thread stickied'),
            'threadUnstickied' => _('Thread unstickied'),
            'reportCleared' => _('Report cleared'),
            'banAdded' => _('Ban added'),
            'confirmUnload' => _('Your message will be lost.'),
            'noNewReplies' => _('No new replies'),
            'showFullMessage' => _('show full message'),
            'passwordsDoNotMatch' => _('The two passwords do not match'),
            'passwordChanged' => _('Password changed'),
            'oldBrowserWarning' => _('You are using an outdated browser which does not support some modern techniques used by this website. Please upgrade your browser.'),
        ];

        return 'let messages=' . json_encode($messages);
    }
}
