<?php
namespace YBoard;

class ApiController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->validateAjaxCsrfToken();
    }
}
