class ApiResponse {
    static error(msg) {
        if (typeof msg !== 'string' || msg === '') {
            msg = 'Error';
        }

        return {
            msgType: 'error',
            msg: msg,
        }
    }

    static success(msg) {
        if (typeof msg !== 'string' || msg === '') {
            msg = 'Success';
        }

        return {
            msgType: 'success',
            msg: msg,
        }
    }

    static redirect(href) {
        if (typeof href !== 'string' || href === '') {
            href = '/';
        }

        return {
            msgType: 'redirect',
            href: href,
        }
    }
}

export { ApiResponse }