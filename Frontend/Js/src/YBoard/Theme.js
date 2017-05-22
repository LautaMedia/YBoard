import YQuery from '../YQuery';

class Theme
{
    constructor()
    {
        let that = this;

        // Switch theme
        document.querySelector('.e-switch-theme').addEventListener('click', function()
        {
            that.switchVariation();
        });

        // Mobile
        document.getElementById('sidebar').addEventListener('click', function (e) {
            if (e.offsetX > document.getElementById('sidebar').clientWidth) {
                document.getElementById('sidebar').classList.toggle('visible');
            }
        });

        document.querySelector('.e-sidebar-toggle').addEventListener('click', function () {
            document.getElementById('sidebar').classList.toggle('visible');
        });

        document.querySelectorAll('body > :not(#topbar):not(#sidebar)').forEach(function (elm) {
            elm.addEventListener('click', function(e)
            {
                let sidebar = document.getElementById('sidebar');
                if (sidebar.classList.contains('visible')) {
                    sidebar.classList.remove('visible');
                }
            });
        });
    }

    toggleSidebar()
    {
        if (document.getElementById('hide-sidebar') !== null) {
            document.getElementById('hide-sidebar').remove();
            document.getElementById('sidebar').classList.remove('visible');

            YQuery.post('/api/user/preferences/set', {
                'hideSidebar': 'false',
            });
        } else {
            let hideSidebarCss = document.createElement('link');
            hideSidebarCss.setAttribute('rel', 'stylesheet');
            hideSidebarCss.setAttribute('id', 'hide-sidebar');
            hideSidebarCss.setAttribute('href', config.staticUrl + '/css/hide_sidebar.css');
            document.querySelector('head').appendChild(hideSidebarCss);

            YQuery.post('/api/user/preferences/set', {
                'hideSidebar': 'true',
            });
        }

    }

    switchVariation()
    {
        let css = document.querySelectorAll('head .css');
        css = css[css.length - 1];

        let light = css.dataset.light;
        let dark = css.dataset.dark;
        let currentIsDark = css.dataset.darktheme === 'true';

        let newVariation;
        let darkTheme;
        if (currentIsDark) {
            newVariation = light;
            darkTheme = false;
        } else {
            newVariation = dark;
            darkTheme = true;
        }

        let newCss = css.cloneNode();

        newCss.setAttributes({
            'href': newVariation,
            'data-darkTheme': darkTheme,
        });
        newCss.appendAfter(css);

        let timeout = setTimeout(function()
        {
            css.remove();
        }, 5000);

        YQuery.post('/api/user/preferences/set', {
            'darkTheme': darkTheme,
        });
    }
}

export default Theme;
