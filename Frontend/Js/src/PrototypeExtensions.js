// These might not be a good idea. I'm just lazy.
// Hopefully they will not completely break down if some browser implements these functions.

Element.prototype.setAttributes = function (attributes) {
    for (let key in attributes) {
        if (!attributes.hasOwnProperty(key)) {
            return true;
        }

        this.setAttribute(key, attributes[key]);
    }
};

Element.prototype.appendBefore = function (elm) {
    elm.parentNode.insertBefore(this, elm);
};

Element.prototype.appendAfter = function (elm) {
    elm.parentNode.insertBefore(this, elm.nextSibling);
};
