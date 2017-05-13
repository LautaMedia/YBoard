import YQuery from '../YQuery';
import YBoard from '../YBoard';

class Theme
{
    toggleSidebar()
    {
        if (document.getElementById('hide-sidebar') !== null) {
            document.getElementById('hide-sidebar').remove();
            document.getElementById('sidebar').classList.remove('visible');

            YQuery.post('/api/user/preferences/sidebar', {
                'sidebarHidden': 'false',
            });
        } else {
            let hideSidebarCss = document.createElement('link');
            hideSidebarCss.setAttribute('rel', 'stylesheet');
            hideSidebarCss.setAttribute('id', 'hide-sidebar');
            hideSidebarCss.setAttribute('href', config.staticUrl + '/css/hide_sidebar.css');
            document.querySelector('head').appendChild(hideSidebarCss);

            YQuery.post('/api/user/preferences/set', {
                'sidebarHidden': 'true',
            });
        }

    }

    switchVariation()
    {
        let css = document.querySelectorAll('head .css');
        css = css[css.length - 1];

        let current = css.getAttribute('href');
        let variation = css.dataset.alt;

        let newCss = document.createElement('link');
        newCss.setAttributes({
            'rel': 'stylesheet',
            'class': 'css',
            'href': variation,
            'data-alt': current,
        });
        newCss.appendAfter(css);

        let timeout = setTimeout(function()
        {
            css.remove();
        }, 5000);

        YQuery.post('/api/user/preferences/set', {
            'themeVariation': 'true',
            'errorFunction': function()
            {
                clearTimeout(timeout);
                YBoard.Toast.error(messages.errorOccurred);
            },
        });
    }
}

export default Theme;
