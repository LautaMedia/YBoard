<?php
namespace YBoard\Controller\Cli;

use YBoard\Model\File;

class FixThings extends AbstractCliDatabase
{
    public function filesizes(): void
    {
        $files = new File($this->db);

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
