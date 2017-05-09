<?php
namespace YBoard\Controllers;

use YBoard\BaseController;
use YBoard\Models\Files;
use YFW\Exception\FileUploadException;
use YFW\Library\TemplateEngine;

class File Extends BaseController
{
    public function upload()
    {
        if (empty($_FILES['file'])) {
            $this->throwJsonError(400, _('No file uploaded'));
        }

        // Check that we have enough free space for files
        if (disk_free_space($this->config['files']['savePath']) <= $this->config['files']['diskMinFree']) {
            $this->throwJsonError(403, _('File uploads are temporarily disabled'));
        }

        // Process file
        $files = new Files($this->db);
        $files->setConfig($this->config['files']);

        if ($_FILES['file']['size'] >= $this->config['files']['maxSize']) {
            $this->throwJsonError(400, _('Your files exceed the maximum upload size.'));
        }

        try {
            $file = $files->processUpload($_FILES['file'], true);
        } catch (FileUploadException $e) {
            $this->throwJsonError(400, $e->getMessage());
        }

        $this->user->statistics->increment('uploadedFiles');
        $this->user->statistics->increment('uploadedFilesTotalSize', $_FILES['file']['size']);

        $this->jsonMessage($file->id);
    }

    public function getMediaPlayer()
    {
        $this->validateAjaxCsrfToken();

        if (empty($_POST['fileId'])) {
            $this->invalidAjaxData();
        }

        $files = new Files($this->db);
        $file = $files->get($_POST['fileId']);

        if ($file === false) {
            $this->throwJsonError(404);
        }
        if ($file->inProgress) {
            $this->throwJsonError(418, _('This file is being processed...'));
        }

        $view = new TemplateEngine(ROOT_PATH . '/YBoard/View/', 'Blank');
        $view->fileUrl = $this->config['view']['staticUrl'] . '/files/' . $file->folder . '/o/' . $file->name . '/' . '1.' . $file->extension;
        $view->poster = $this->config['view']['staticUrl'] . '/files/' . $file->folder . '/t/' . $file->name . '.jpg';

        $view->loop = $file->isGif;

        $view->display('Ajax/MediaPlayer');
    }
}
