module.exports = {
    customLogLevel: function (res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn'
        } else if (res.statusCode >= 500 || err) {
            return 'error'
        }
        return 'info'
    },
    serializers: {
        req: function customReqSerializer (req) {
            // delete req.headers;
            return req;
        },
        res: function customResSerializer (res) {
            // delete res.headers;
            if (res && res.raw && res.raw.req && res.raw.req.user) {
                res.userId = res.raw.req.user.id;
            }
            return res;
        }
    }
};
