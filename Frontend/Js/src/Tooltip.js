class Tooltip
{
    constructor(e, options = {})
    {
        this.options = Object.assign({
            'openDelay': 100,
            'offset': 10,
            'content': '',
            'onOpen': null,
            'onClose': null,
            'closeEvent': 'mouseout',
            'position': 'bottom',
        }, options);

        // Placeholders for tip position
        this.x = 0;
        this.y = 0;
        this.spaceAvailable = {
            'top': 0,
            'right': 0,
            'bottom': 0,
            'left': 0,
        };

        // Other
        this.overflows = false;
        this.event = e;
        this.id = 0;

        this.open();
    }

    open()
    {
        let that = this;

        this.elm = document.createElement('div');
        this.elm.classList.add('tooltip');

        let lastTip = document.querySelector('.tooltip:last-of-type');
        if (lastTip !== null) {
            this.id = parseInt(document.querySelector('.tooltip:last-of-type').dataset.id) + 1;
        }
        this.elm.dataset.id = this.id;

        this.setContent(this.options.content);

        let closeEventFn = function()
        {
            that.event.target.removeEventListener(that.options.closeEvent, closeEventFn);
            that.close(that);
        };

        this.event.target.addEventListener(this.options.closeEvent, closeEventFn);
        this.event.target.tooltip = this;

        if (this.options.openDelay !== 0) {
            setTimeout(function() {
                if (that.elm === null) {
                    return;
                }
                that.appendTip();
            }, this.options.openDelay);
        } else {
            this.appendTip();
        }
    }

    appendTip()
    {
        document.body.appendChild(this.elm);

        if (typeof this.options.onOpen === 'function') {
            this.options.onOpen(this);
        }

        this.position();
    }

    setContent(content)
    {
        if (this.elm === null) {
            return;
        }

        this.elm.innerHTML = '<div class="tooltip-content">' + content + '</div>';
    }

    getContent()
    {
        if (this.elm === null) {
            return;
        }

        return this.elm.querySelector('.tooltip-content').innerHTML;
    }

    close()
    {
        if (typeof this.options.onClose === 'function') {
            this.options.onClose(this);
        }

        this.elm = null;

        let tip = document.querySelector('.tooltip[data-id="' + this.id + '"]');

        if (tip !== null) {
            tip.remove();
        }
    }

    position()
    {
        if (this.elm === null) {
            return;
        }

        this.targetRect = this.event.target.getBoundingClientRect();
        this.tipRect = this.elm.getBoundingClientRect();

        this.spaceAvailable = {
            'top': this.targetRect.top,
            'right': window.innerWidth - this.targetRect.right,
            'bottom': window.innerHeight - this.targetRect.bottom,
            'left': this.targetRect.left,
        };

        this.calculatePosition(this.options.position);
        this.elm.classList.add(this.options.position);

        this.setPosition();
    }

    calculatePosition(position)
    {
        this.options.position = position;

        // Calculate X
        switch (position) {
            case 'top':
            case 'bottom':
                this.x = this.targetRect.right - this.targetRect.width / 2 - this.tipRect.width / 2;

                if (this.x + this.tipRect.width > window.innerWidth) {
                    this.x = window.innerWidth - this.tipRect.width;
                }

                if (this.x < 0) {
                    this.x = 0;
                }

                break;
            case 'right':
                this.x = this.targetRect.right + this.options.offset;
                if (this.tipRect.width + this.options.offset > this.spaceAvailable.right) {
                    if (this.overflows || this.spaceAvailable.left < this.spaceAvailable.right) {
                        // Fits better to right than to left
                        this.elm.style.maxWidth = this.spaceAvailable.right - this.options.offset + 'px';
                        this.tipRect = this.elm.getBoundingClientRect();
                    } else {
                        // Overflows, position on left
                        return this.recalculatePosition('left');
                    }
                }

                break;
            case 'left':
                this.x = this.targetRect.left - this.tipRect.width - this.options.offset;
                if (this.x < 0) {
                    if (this.overflows || this.spaceAvailable.right < this.spaceAvailable.left) {
                        // Fits better to left than to right
                        this.elm.style.maxWidth = this.spaceAvailable.left - this.options.offset + 'px';
                        this.tipRect = this.elm.getBoundingClientRect();
                    } else {
                        // Overflows, position on right
                        return this.recalculatePosition('right');
                    }
                }
                break;
        }

        // Calculate Y
        switch (position) {
            case 'top':
                this.y = this.targetRect.top - this.tipRect.height - this.options.offset;
                if (this.y < 0) {
                    // Tip is larger than available space
                    if (this.overflows || this.spaceAvailable.bottom < this.spaceAvailable.top) {
                        // Fits better to top than to bottom
                        this.y = 0;
                        this.elm.style.maxHeight = this.spaceAvailable.top - this.options.offset + 'px';
                        this.tipRect = this.elm.getBoundingClientRect();
                    } else {
                        // Overflows, position on bottom
                        return this.recalculatePosition('bottom');
                    }
                }
                break;
            case 'bottom':
                this.y = this.targetRect.bottom + this.options.offset;
                if (this.tipRect.height + this.options.offset > this.spaceAvailable.bottom) {
                    // Tip is larger than available space
                    if (this.overflows || this.spaceAvailable.top < this.spaceAvailable.bottom) {
                        // Fits better to bottom than to top
                        this.elm.style.maxHeight = this.spaceAvailable.bottom - this.options.offset + 'px';
                        this.tipRect = this.elm.getBoundingClientRect();
                    } else {
                        // Overflows, position on top
                        return this.recalculatePosition('top');
                    }
                }
                break;
            case 'right':
            case 'left':
                this.y = this.targetRect.bottom - this.targetRect.height / 2 - this.tipRect.height / 2;
                if (this.y < 0) {
                    this.y = 0;
                }
                break;
        }
    }

    recalculatePosition(position)
    {
        this.overflows = true;
        this.calculatePosition(position);
    }

    setPosition()
    {
        this.elm.style.left = window.scrollX + this.x + 'px';
        this.elm.style.top = window.scrollY + this.y + 'px';
    }
}

export default Tooltip;
