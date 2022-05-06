// override-fastclick's needsClick method to include input elements using ui-date directive

FastClick.prototype.needsClick = function(target) {
    var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;
    var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;

    switch (target.nodeName.toLowerCase()) {

        // Don't send a synthetic click to disabled inputs (issue #62)
        case 'button':
        case 'select':
        case 'textarea':
            if (target.disabled) {
                return true;
            }

            break;
        case 'input':

            // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
            // eslint-disable-next-line no-undef
            if ((deviceIsIOS && target.type === 'file') || target.disabled ||
                target.hasAttribute('ui-date')) {
                return true;
            }

            break;
        case 'label':
        case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
        case 'video':
            return true;
    }

    return (/\bneedsclick\b/).test(target.className);
};
