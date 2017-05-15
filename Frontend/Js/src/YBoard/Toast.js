class Toast
{
    success(message, title = false)
    {
        this._show('success', message, title);
    }

    info(message, title = false)
    {
        this._show('info', message, title);
    }

    warning(message, title = false)
    {
        this._show('warning', message, title);
    }

    error(message, title = false)
    {
        this._show('error', message, title);
    }

    _show(type, message, title)
    {
        title = title !== false ? title + "\n\n" : '';
        alert(type + "\n\n" + title + message);
    }
}

export default Toast;
