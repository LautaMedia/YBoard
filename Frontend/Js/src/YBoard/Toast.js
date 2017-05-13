class Toast
{
    success(message, title = false)
    {
        this._show('success', message, title);
    }

    info(message, title = '')
    {
        this._show('info', message, title);
    }

    warning(message, title = '')
    {
        this._show('warning', message, title);
    }

    error(message, title = '')
    {
        this._show('error', message, title);
    }

    _show(type, message, title)
    {
        alert(type + ': ' + title + "\n\n" + message);
    }
}

export default Toast;
