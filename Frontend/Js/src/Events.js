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
