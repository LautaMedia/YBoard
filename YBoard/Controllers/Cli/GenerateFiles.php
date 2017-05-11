<?php
namespace YBoard\Controllers\Cli;

use YBoard\Traits\JsMessages;
use YFW\Controller;
use YFW\Library\i18n;

class GenerateFiles extends Controller
{
    use JsMessages;

    public function jsLocales()
    {
        $i18n = new i18n(ROOT_PATH . '/YBoard/Locales');

        $outPath = ROOT_PATH . '/static/js/locales';
        if (!is_dir($outPath)) {
            mkdir($outPath, 0774, true);
        }

        foreach ($i18n->listLocales() as $locale => $domains) {
            foreach ($domains as $domain) {
                $i18n->loadLocale($locale, $domain);

                $outFile = $outPath . '/' . $locale . '.' . $domain . '.js';
                file_put_contents($outFile, $this->getJsMessages());
                echo 'Generated: ' . $locale . '.' . $domain . "\n";
            }
        }

        echo 'All done!';
    }
}
