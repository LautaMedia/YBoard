<?php /*>
<h1>Oh noes! What happened!?</h1>

<p>
    You see this message because something has really gone wrong.<br />
    Please be patient and try again soon, we'll try to figure out what happened.
</p>
<!-- PHP is not executing scripts! -->

<!-- */

putenv('APPLICATION_ENVIRONMENT=development');
define('PUBLIC_PATH', __DIR__);
require('../YFW/Bootstrap.php');

$bootstrap = new \YFW\Bootstrap();
$bootstrap->setErrorPage('YBoard/Views/BasicError');
$bootstrap->run('YBoard');

// -->
