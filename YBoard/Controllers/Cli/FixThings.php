<?php
namespace YBoard\Controllers\Cli;

use YBoard\Abstracts\AbstractCliDatabase;
use YBoard\Models\Files;

class FixThings extends AbstractCliDatabase
{
    public function filesizes()
    {
        $files = new Files($this->db);

        $glob = glob(ROOT_PATH . '/public/static/files/*/t/*.*');
        foreach ($glob AS $filePath) {
            $fileName = pathinfo($filePath, PATHINFO_FILENAME);

            $file = $files->getByName($fileName);
            if (!$file) {
                continue;
            }

            $file->updateSize(filesize($filePath));

            echo "\n" . $filePath . " updated";
        }
    }
}
