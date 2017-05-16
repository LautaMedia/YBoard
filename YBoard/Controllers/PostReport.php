<?php
namespace YBoard\Controllers;

use YBoard\BaseController;
use YBoard\Models;

class PostReport extends BaseController
{
    public function uncheckedReports(): void
    {
        $this->modOnly();

        $postReports = new PostReport($this->db);
        $view = $this->loadTemplateEngine();
        $view->pageTitle = _('Reports');

        $view->reports = $postReports->getUnchecked();
        $view->display('Mod/Reports');
    }

    public function setChecked(): void
    {
        $this->modOnly();
        $this->validateAjaxCsrfToken();

        if (empty($_POST['post_id'])) {
            $this->throwJsonError(400);
        }

        $reports = new PostReport($this->db);
        $report = $reports->get($_POST['post_id']);
        if ($report === false) {
            $this->throwJsonError(404, _('Report does not exist'));
        }

        $log = new LogModel($this->db);
        $log->write(LogModel::ACTION_ID_MOD_REPORT_CHECKED, $this->user->id, $report->id);
        $report->setChecked($this->user->id);
    }

    public function getForm(): void
    {
        $view = $this->loadTemplateEngine('Blank');

        $view->reasons = Ban::getReasons();
        $view->display('Ajax/ReportForm');
    }
}
