<?php
namespace YFW\Library;

class CliLogger
{
    public static function write(string $str, $logFile = false)
    {
        if (!$logFile) {
            $logFile = ROOT_PATH . '/Logs/cli.log';
        }

        $str = '[' . date('r') . '] ' . $str . "\n";

        file_put_contents($logFile, $str, FILE_APPEND);
    }
}
