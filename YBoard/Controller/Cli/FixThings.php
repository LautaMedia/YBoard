<?php
namespace YBoard\Controller\Cli;

use YBoard\CliController;
use YBoard\Model\File;

class FixThings extends CliController
{
    public function filesizes(): void
    {
        $glob = glob($this->config['file']['savePath'] . '/[a-z0-9][a-z0-9]/{0,t}/*.*', GLOB_BRACE);
        foreach ($glob AS $filePath) {
            $fileName = pathinfo($filePath, PATHINFO_FILENAME);

            $file = File::getByName($this->db, $fileName);
            if (!$file) {
                continue;
            }

            $file->setSize(filesize($filePath));

            echo $filePath . " updated\n";
        }
    }
}
