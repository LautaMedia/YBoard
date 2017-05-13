import YBoard from './YBoard';

// Go to top
document.getElementById('scroll-to-top').addEventListener('click', function()
{
    window.scrollTo(0, 0);
});

// Go to bottom
document.getElementById('scroll-to-bottom').addEventListener('click', function()
{
    window.scrollTo(0, document.body.scrollHeight);
});

// Reload page
document.getElementById('reload-page').addEventListener('click', function()
{
    window.scrollTo(0, document.body.scrollHeight);
});





// Modal close
// -------------------------------------------
.on('click', '.modal-close', function () {
    YB.modal.close();
})

// Mobile menu
// -------------------------------------------
.on('click', '#sidebar', function (e) {
    if (e.offsetX > document.getElementById('sidebar').clientWidth) {
        document.getElementById('sidebar').classList.toggle('visible');
    }
})
.on('click', '.sidebar-toggle', function () {
document.getElementById('sidebar').classList.toggle('visible');
})
.on('click', 'body >:not(#topbar):not(#sidebar)', function () {
document.getElementById('sidebar').classList.remove('visible');
})

// Theme switcher
// -------------------------------------------
.on('click', '.switch-theme', function () {
    YB.theme.switchVariation();
})

// AJAX forms
// -------------------------------------------
.on('submit', 'form.ajax', function (event) {
    YB.submitForm(event);
})

// Sidebar signup & hide
// -------------------------------------------
.on('click', '#login .signup', function (event) {
    YB.signup(this, event);
})
.on('click', '#sidebar-hide-button', function () {
YB.theme.toggleSidebar();
})
})

// Session management
// -------------------------------------------
.on('submit', 'form.sessiondestroy', function (event) {
var sessionId = $(event.target).find('input').val();
document.getElementById(sessionId).remove();
})

// Notifications
// -------------------------------------------
.on('click', '.open-notifications', function () {
    YB.notifications.get();
})

// Autoupdate
// -------------------------------------------
.on('click', '.get-replies', function () {
    var threadId = $(this).closest('.thread').data('id');
    YB.thread.ajaxUpdate.runOnce(threadId);
})

// Post files
// -------------------------------------------
.on('click', '.post figure.thumbnail .image', function (event) {
    if (event.ctrlKey || event.altKey) {
        return true;
    }
    event.preventDefault();
    YB.post.file.expand($(this).parent('figure'));
})
.on('click', '.post figure:not(.thumbnail) .image', function (event) {
    if (event.ctrlKey || event.altKey) {
        return true;
    }
    event.preventDefault();
    YB.post.file.restoreThumbnail($(this).parent('figure'));
})

.on('click', '.post figure.thumbnail .media', function (event) {
    if (event.ctrlKey || event.altKey) {
        return true;
    }
    event.preventDefault();
    YB.post.file.playMedia($(this).parent('figure'));
})
.on('click', '.stop-media', function (event) {
    event.preventDefault();
    YB.post.file.stopAllMedia();
})
